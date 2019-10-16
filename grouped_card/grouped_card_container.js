import React from 'react'
import ReactDOM from 'react-dom'
import isEqual from 'lodash/isEqual'
import GroupedCard from './grouped_card'
import {formatType, displayData} from '../common'

const baseOptions = {
  // grouping_metric: {
  //   type: 'boolean',
  //   label: 'Title of metric grouping',
  //   section: 'Grouping',
  //   default: false,
  //   order: 1
  // },
  grouping_layout: {
    type: 'string',
    label: 'Layout',
    display: 'select',
    values: [
      {'Vertical': 'vertical'},
      {'Horizontal': 'horizontal'},
    ],
    section: 'Grouping',
    default: 'vertical',
    order: 2,
  },
  grouping_font: {
    type: 'string',
    label: 'Univeral Font',
    display: 'select',
    values: [
      {'Arial': 'Arial'},
      {'Verdana': 'Verdana'},
      {'Tahoma': 'Tahoma'},
      {'Times New Roman': 'Times New Roman'},
      {'Open Sans': 'Open Sans'},
    ],
    default: 'Open Sans',
    section: 'Grouping',
    order: 3,
  },
  // image_supported: {
  //   type: 'boolean',
  //   label: 'Support images from data',
  //   section: 'Images',
  //   order: 1,
  // },
  // image_arbitrary: {
  //   type: 'string',
  //   label: 'Arbitrary images',
  //   section: 'Images',
  //   order: 2,
  // },
}

let currentOptions = {}
let currentConfig = {}

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "grouped_card",
  label: "Grouped Card",
  options: baseOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Render to the target element
    this.chart = ReactDOM.render(
      <GroupedCard
        config={{}}
        data={[]}
      />,
      element
    );

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {

    // Clear any errors from previous updates
    this.clearErrors();

    const measures = [].concat(
      queryResponse.fields.measures,
      queryResponse.fields.table_calculations.filter(calc => calc.measure === true)
    )

    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (measures.length == 0) {
      this.addError({title: "No Measures", message: "This chart requires measures"});
      return;
    }

    if (queryResponse.fields.pivots.length) {
      this.addError({title: "Pivoting not allowed", message: "This visualization does not allow pivoting"});
      return;
    }
    
    if (measures.length > 10) {
      this.addError({title: "Maximum number of data points", message: "This visualization does not allow more than 10 data points to be selected"});
      return;
    }

    let firstRow = data[0];

    const dataPoints = measures.map(measure => {
      const formattedValue = formatType(config[`value_format_${measure.name}`] || measure.value_format)(firstRow[measure.name].value)
      return ({
        name: measure.name,
        label: measure.label_short || measure.label,
        value: firstRow[measure.name].value,
        valueFormat: measure.value_format,
        formattedValue: displayData(firstRow[measure.name], formattedValue)
      })
    });

    const options = Object.assign({}, baseOptions)
    
    dataPoints.forEach((dataPoint, index) => {

      // Style - only data points
      if (config[`show_comparison_${dataPoint.name}`] !== true) {
        options[`style_${dataPoint.name}`] = {
          type: `array`,
          label: `${dataPoint.label} - Style`,
          display: `color`,
          default: '#a5a6a1',
          section: 'Style',
          order: index,
        }

        options[`show_tile_${dataPoint.name}`] = {
          type: 'boolean',
          label: `${dataPoint.label} - Show Tile`,
          default: true,
          section: 'Measures',
          order: 10 * index,
        }
        options[`title_overrride_${dataPoint.name}`] = {
          type: 'string',
          label: `${dataPoint.label} - Title`,
          section: 'Measures',
          placeholder: dataPoint.label,
          order: 10 * index + 1,
        }
        options[`title_placement_${dataPoint.name}`] = {
          type: 'string',
          label: `${dataPoint.label} - Title Placement`,
          section: 'Measures',
          display: 'select',
          values: [
            {'Above number': 'above'},
            {'Below number': 'below'},
          ],
          default: 'above',
          order: 10 * index + 2,
        }
        options[`value_format_${dataPoint.name}`] = {
          type: 'string',
          label: `${dataPoint.label} - Value Format`,
          section: 'Measures',
          default: dataPoint.valueFormat,
          order: 10 * index + 3
        }
        // options[`look_feel_${dataPoint.name}`] = {
        //   type: 'string',
        //   label: `${dataPoint.label} - Look & Feel`,
        //   section: 'Measures',
        //   order: 10 * index + 4,
        // }
        // options[`drilling_${dataPoint.name}`] = {
        //   type: 'boolean',
        //   label: `${dataPoint.label} - Supports Drilling`,
        //   section: 'Measures',
        //   default: false,
        //   order: 10 * index + 5,
        // }
      }

      // Comparison - all data points other than the first
      if (index >= 1) {
        options[`show_comparison_${dataPoint.name}`] = {
          type: 'boolean',
          label: `${dataPoint.label} - Show as comparison`,
          section: 'Comparison',
          default: false,
          order: 10 * index,
        }

        if (config[`show_comparison_${dataPoint.name}`] === true) {
          options[`comparison_style_${dataPoint.name}`] = {
            type: 'string',
            display: 'radio',
            label: `${dataPoint.label} - Style`,
            values: [
              {'Show as Value': 'value'},
              {'Show as Percentage Change': 'percentage_change'},
              {'Calculate Progress': 'calculate_progress'},
              {'Calculate Progress (with Percentage)': 'calculate_progress_perc'},
            ],
            section: 'Comparison',
            default: 'value',
            order: 10 * index + 1,
          }
          options[`comparison_show_label_${dataPoint.name}`] = {
            type: 'boolean',
            label: `${dataPoint.label} - Show Label`,
            section: 'Comparison',
            default: true,
            order: 10 * index + 2,
          }
          if (config[`comparison_show_label_${dataPoint.name}`]) {
            options[`comparison_label_${dataPoint.name}`] = {
              type: 'string',
              label: `${dataPoint.label} - Label`,
              placeholder: dataPoint.label,
              section: 'Comparison',
              order: 10 * index + 3,
            }
            options[`comparison_label_placement_${dataPoint.name}`] = {
              type: 'string',
              label: `${dataPoint.label} - Label Placement`,
              display: 'select',
              values: [
                {'Above': 'above'},
                {'Below': 'below'},
                {'Left': 'left'},
                {'Right': 'right'},
              ],
              default: 'below',
              section: 'Comparison',
              order: 10 * index + 4,
            }
          }
        }
      }
    })
  
    if (
      !isEqual(currentOptions, options) ||
      !isEqual(currentConfig, config)
    ) {
      this.trigger('registerOptions', options)
      currentOptions = Object.assign({}, options)
      currentConfig = Object.assign({}, config)
    }

    let valuesToComparisonsMap = {}
    let lastDataPointIndex = -1
    const fullValues = dataPoints.filter((dataPoint, index) => {
      if (config[`show_comparison_${dataPoint.name}`] !== true) {
        lastDataPointIndex++
        return true
      } else {
        valuesToComparisonsMap[lastDataPointIndex] = index
      }
      return false
    }).map((fullValue, index) => {
      const comparisonIndex = valuesToComparisonsMap[index]
      if (comparisonIndex) {
        fullValue.comparison = dataPoints[comparisonIndex]
      }
      return fullValue;
    })

    // Finally update the state with our new data
    this.chart = ReactDOM.render(
      <GroupedCard
        config={config}
        data={fullValues}
      />,
      element
    );

    // We are done rendering! Let Looker know.
    done()
  }
});
