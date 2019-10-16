import React from "react";
import ReactDOM from "react-dom";
import { formatType, handleErrors } from "../common";
import GaugeChart from "./gauge_chart";
import styled from "styled-components";
const colorByOps = {
  SEGMENT: "segment",
  RANGE: "range"
};
const baseOptions = {
  color_by: {
    type: "string",
    label: "Color By",
    display: "select",
    section: "Style",
    values: [
      { "Color By Segment": colorByOps.SEGMENT },
      { "Color By Range": colorByOps.RANGE }
    ],
    default: colorByOps.RANGE,
    order: 2
  },
  segments: {
    type: "string",
    label: "Gauge Segments",
    display: "select",
    values: [
      { 2: "2" },
      { 3: "3" },
      { 4: "4" },
      { 5: "5" },
      { 6: "6" },
      { 7: "7" },
      { 8: "8" },
      { 9: "9" },
      { 10: "10" }
    ],
    default: 3,
    section: "Style",
    order: 2
  },
  thickness: {
    type: "string",
    label: "Gauge Thickness",
    display: "select",
    values: [
      { "10": "10" },
      { "20": "20" },
      { "30": "30" },
      { "40": "40" },
      { "50": "50" },
      { "60": "60" },
      { "70": "70" },
      { "80": "80" },
      { "90": "90" },
      { "100": "100" }
    ],
    default: "50",
    section: "Style",
    order: 3
  },

  font_size_title: {
    type: "string",
    label: "Title Font Size",
    default: "24",
    section: "Style",
    order: 7
  },
  font_size_target: {
    type: "string",
    label: "Target Font Size",
    default: "16",
    section: "Style",
    order: 9
  },
  font_size_arc: {
    type: "string",
    label: "Arc Font Size",
    default: "16",
    section: "Style",
    order: 8
  },
  font_size_main: {
    type: "string",
    label: "Value Font Size",
    default: "32",
    section: "Style",
    order: 9
  },
  target_display: {
    type: "boolean",
    label: "Display Target",
    values: [{ Yes: true }, { No: false }],
    display: "radio",
    default: true,
    section: "Style",
    order: 10
  },
  target_color: {
    type: "array",
    label: "Target Color",
    display: "color",
    default: ["#6565ee"],
    section: "Style",
    order: 11
  },
  target_label: {
    type: "string",
    label: "Target Label",
    default: "Target: ",
    section: "Values",
    order: 4
  },

  target_value: {
    type: "number",
    label: "Target Value",
    default: 0,
    section: "Values"
  }
};

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "gauge_chart",
  label: "Gauge Chart",
  options: baseOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    this.chart = ReactDOM.render(<div>...Loading</div>, element);
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    if (
      !handleErrors(this, queryResponse, {
        min_pivots: 0,
        max_pivots: 0,
        min_dimensions: 0,
        max_dimensions: 1,
        min_measures: 1,
        max_measures: 1
      })
    )
      return;
    this.clearErrors();

    const width = element.clientWidth;
    const height = element.clientHeight;

    const GaugeChartWrapper = styled.div`
      text-align: center;
      font-family: "Open Sans", "Noto Sans JP", "Noto Sans", "Noto Sans CJK KR",
        Helvetica, Arial, sans-serif;
      color: #3a4245;
    `;

    // Grab the first cell of the data
    var firstRow = data[0];
    //const firstCell = firstRow[queryResponse.fields.dimensions[0].name].value;
    //const firstCol = firstRow[queryResponse.fields.measures[0].name];

    const dataPoints = queryResponse.fields.measures.map(measure => {
      const formattedValue = formatType(
        config[`value_format_${measure.label}`] || measure.value_format
      )(firstRow[measure.name].value);
      return {
        name: measure.name,
        label: measure.label,
        value: firstRow[measure.name].value,
        valueFormat: config[`value_format_${measure.label}`],
        formattedValue: formattedValue
      };
    });

    const options = baseOptions;

    options[`${dataPoints[0].label}_color_range`] = {
      type: `array`,
      label: `${dataPoints[0].label} - Color Range`,
      display: `colors`,
      default: ["#6565ee", "#33a7ed"],
      section: "Style",
      order: 0
    };

    options[`${dataPoints[0].label}_color_segments`] = {
      type: `array`,
      label: `${dataPoints[0].label} - Color Segments`,
      display: `colors`,
      default: ["#6565ee", "#33a7ed"],
      section: "Style",
      order: 1
    };
    options[`range_${dataPoints[0].label}`] = {
      type: "array",
      label: `${dataPoints[0].label} - Range Values`,
      display: "mimax_values",
      default: [0, dataPoints[0].value],
      section: "Values"
    };
    options[`show_title_${dataPoints[0].label}`] = {
      type: "boolean",
      label: `Show ${dataPoints[0].label} - Title`,
      default: true,
      section: "Values"
    };
    options[`title_override_${dataPoints[0].label}`] = {
      type: "string",
      label: `Override ${dataPoints[0].label} - Title`,
      section: "Values",
      default: `${dataPoints[0].label}`,
      placeholder: `${dataPoints[0].label}`
      //order: 10 * index + 1
    };
    options[`value_format_${dataPoints[0].label}`] = {
      type: "string",
      label: `${dataPoints[0].label} - Value Format`,
      section: "Values",
      default: "#,##0.00",
      placeholder: "#,##0.00"
    };

    this.trigger("registerOptions", options);
    // Finally update the state with our new data
    this.chart = ReactDOM.render(
      <GaugeChartWrapper>
        <GaugeChart
          containerHeight={height}
          width={710}
          height={510}
          target={config.target_value}
          config={config}
          data={dataPoints}
          colors={
            config.color_by == "range"
              ? config[`${dataPoints[0].label}_color_range`]
              : config[`${dataPoints[0].label}_color_segments`]
          }
          title_display={config[`show_title_${dataPoints[0].label}`]}
          title={config[`title_override_${dataPoints[0].label}`]}
          range={config[`range_${dataPoints[0].label}`]} //needs variable value
          value_format={config[`value_format_${dataPoints[0].label}`]}
          formatted_value={dataPoints[0].formattedValue}
          percentage={false}
        />
      </GaugeChartWrapper>,
      element
    );

    // We are done rendering! Let Looker know.
    done();
  }
});
