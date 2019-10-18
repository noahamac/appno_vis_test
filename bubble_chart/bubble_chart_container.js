import React from 'react'
import ReactDOM from 'react-dom'
import BubbleChart from './bubble_chart'

const baseOptions = {
  value_colors: {
    type: "array",
    label: "Value Color Range",
    display: "colors",
    section: "Series",
    order: 1,
    default: ["#3EB0D5", "#B1399E", "#C2DD67", "#592EC2", "#4276BE", "#72D16D", "#FFD95F", "#B32F37", "#9174F0", "#E57947", "#75E2E2", "#FBB555"]
  },
  value_labels: {
    type: 'boolean',
    label: `Display Value Labels`,
    default: true,
    section: 'Series',
    order: 2,
  },
  value_titles: {
    type: 'boolean',
    label: `Display Value Titles`,
    default: true,
    section: 'Series',
    order: 3,
  },
  // group_by_category: {
  //   type: 'boolean',
  //   label: `Group by Category`,
  //   default: true,
  //   section: 'Series',
  //   order: 4,
  // },
};

looker.plugins.visualizations.add({
  id: "bubble_chart",
  label: "Bubble Chart",
  options: baseOptions,

  create: function(element, config) {
    // Render to the target element
    this.chart = ReactDOM.render(
      <BubbleChart />,
      element
    );
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates
    this.clearErrors();

    const dimensions = [].concat(
      queryResponse.fields.dimensions,
      queryResponse.fields.table_calculations.filter(calc => calc.measure === false)
    )

    const measures = [].concat(
      queryResponse.fields.measures,
      queryResponse.fields.table_calculations.filter(calc => calc.measure === true)
    )
  
    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (measures.length < 2) {
      this.addError({title: "Too few measures", message: "This chart requires at least 2 measures selected."});
      return;
    }
    if (dimensions.length < 1) {
      this.addError({title: "Dimensions", message: "This chart requires at least 1 dimension."});
      return;
    }

    // const secondDimension = dimensions[1]
    const firstMeasure = measures[0]
    const secondMeasure = measures[1]
    
    const bubbleChartData = []

    data.forEach((row, index) => {
      const dimensionValue = dimensions.map(dimension => row[dimension.name].rendered || row[dimension.name].value).join('-')
      // const secondDimensionValue = secondDimension && row[secondDimension.name].value
      const firstMeasureValue = firstMeasure && row[firstMeasure.name].value
      const secondMeasureValue = secondMeasure && row[secondMeasure.name].value
      
      bubbleChartData.push({
        itemName: dimensionValue,
        // groupName: secondDimensionValue,
        value: config['size_by'] ? row[config['size_by']].value : firstMeasureValue,
        color: config['color_by'] ? row[config['color_by']].value : secondMeasureValue
      })
    })

    const options = baseOptions
    
    options[`size_by`] = {
      type: 'string',
      label: 'Size by',
      display: 'select',
      values: measures.map(measure => ({
        [measure.label]: measure.name
      })),
      section: 'Series',
      default: firstMeasure && firstMeasure.name,
      order: 5,
    }

    options[`color_by`] = {
      type: 'string',
      label: 'Color by',
      display: 'select',
      values: measures.map(measure => ({
        [measure.label]: measure.name
      })),
      section: 'Series',
      default: secondMeasure && secondMeasure.name,
      order: 6,
    }

    this.trigger('registerOptions', options)

    // Finally update the state with our new data
    this.chart = ReactDOM.render(
      <BubbleChart
        config={config}
        data={bubbleChartData}
      />,
      element
    );

    // We are done rendering! Let Looker know.
    done()
  }
});
