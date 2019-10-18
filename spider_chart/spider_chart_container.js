import React from 'react'
import ReactDOM from 'react-dom'
import SpiderChart from './spider_chart'

const baseOptions = {
  chart_fill: {
    type: 'string',
    label: 'Chart Fill',
    display: 'select',
    values: [
      {'Line': 'line'},
      {'Area': 'area'},
    ],
    section: 'Style',
    default: 'line',
    order: 1,
  },
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
  hide_axis_values: {
    type: 'boolean',
    label: `Hide Axis Values`,
    default: false,
    section: 'Axis',
    order: 1,
  },
  hide_axis_gridlines: {
    type: 'boolean',
    label: `Hide Gridlines`,
    default: false,
    section: 'Axis',
    order: 2,
  }
};

looker.plugins.visualizations.add({
  id: "spider_chart",
  label: "Spider Chart",
  options: baseOptions,

  create: function(element, config) {
    // Render to the target element
    this.chart = ReactDOM.render(
      <SpiderChart />,
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
    if (measures < 3) {
      this.addError({title: "Too few measures", message: "This chart requires at least 3 measures selected."});
      return;
    }
    if (dimensions < 1) {
      this.addError({title: "Dimensions", message: "This chart requires at least 1 dimension selected."});
      return;
    }

    const spiderData = []
    const legendValues = []

    data.forEach((row, index) => {
      const legendValue = dimensions.map(dimension => row[dimension.name].rendered || row[dimension.name].value).join('-')
      legendValues.push(legendValue)
  
      spiderData[index] = spiderData[index] ? spiderData[index] : []

      queryResponse.fields.measures.forEach((measure, mIndex) => {
        const measureValue = row[measure.name].value
        spiderData[index].push({
          area: measure.label_short,
          value: measureValue || 0
        })
      })
    })

    const options = baseOptions
    
    this.trigger('registerOptions', options)

    // Finally update the state with our new data
    this.chart = ReactDOM.render(
      <SpiderChart
        legendValues={legendValues}
        config={config}
        data={spiderData}
      />,
      element
    );

    // We are done rendering! Let Looker know.
    done()
  }
});
