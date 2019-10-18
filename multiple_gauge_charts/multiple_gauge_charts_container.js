import GaugeChart from "../gauge_chart/gauge_chart";
import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { formatType, handleErrors } from "../common";

const baseOptions = {
  columns: {
    type: "string",
    label: "Columns",
    display: "select",
    values: [{ 2: "2" }, { 3: "3" }],
    default: "2",
    section: "Style",
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
  },
  display_title: {
    type: "boolean",
    label: "Display Title",
    default: true,
    section: "Values"
  },
  value_format: {
    type: "string",
    label: `Value Format`,
    section: "Values",
    default: "",
    placeholder: "#,##0.00"
  }
};

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "multiple_gauge_chart",
  label: "Multiple Gauge Chart",
  options: baseOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    this.chart = ReactDOM.render(<div>...Loading</div>, element);
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates
    if (
      !handleErrors(this, queryResponse, {
        min_pivots: 0,
        max_pivots: 0,
        min_dimensions: 1,
        max_dimensions: 1,
        min_measures: 1,
        max_measures: 1
      })
    )
      return;
    this.clearErrors();

    const MultipleGaugeGrid = styled.div`
      text-align: center;
      font-family: "Open Sans", "Noto Sans JP", "Noto Sans", "Noto Sans CJK KR",
        Helvetica, Arial, sans-serif;
      display: grid;
      grid-template-columns: repeat(
        ${props => props.cols},
        minmax(50px, 400px)
      );
      grid-gap: 3rem;
    `;

    const MultipleGaugeWrapper = styled.div`
      display: flex;
      justify-content: center;
    `;

    const options = baseOptions;

    const dataPoints = row => {
      return queryResponse.fields.measures.map(measure => {
        return {
          name: measure.name,
          label: measure.label_short,
          value: data[row][measure.name].value,
          valueFormat: config.value_format,
          formattedValue: data[row][measure.name].value
        };
      });
    };
    const dimensionsRows = row => {
      return queryResponse.fields.dimensions.map(dimension => ({
        name: dimension.name,
        label: dimension.label_short,
        value: data[row][dimension.name].value,
        valueFormat: dimension.value_format
      }));
    };

    data.map((row, index) => {
      options[`${dimensionsRows(index)[0].value}_color_range`] = {
        type: `array`,
        label: `${dimensionsRows(index)[0].value} - Color Range`,
        display: `colors`,
        default: ["#a5a6a1"],
        section: "Gauges"
      };

      options[`${dimensionsRows(index)[0].value}_color_range`] = {
        type: `array`,
        label: `${dimensionsRows(index)[0].value} - Color Range`,
        display: `colors`,
        default: ["#6565ee", "#33a7ed"],
        section: "Style",
        order: 0
      };

      options[`title_override_${dimensionsRows(index)[0].value}`] = {
        type: "string",
        label: `Override ${dimensionsRows(index)[0].value} Title`,
        section: "Values",
        default: `${dimensionsRows(index)[0].value}`,
        placeholder: `${dimensionsRows(index)[0].value}`
      };
    });

    this.trigger("registerOptions", options);

    const MultipleGaugeItems = () => (
      <MultipleGaugeWrapper>
        <MultipleGaugeGrid cols={config.columns}>
          {data.map((row, index) => {
            const dimVal = dimensionsRows(index)[0].value;
            const formattedValue = formatType(
              config.value_format || dataPoints(index)[0].value_format
            )(`${dataPoints(index)[0].value}`);

            return (
              <GaugeChart
                size={800}
                width={710}
                height={450}
                target={config.target_value}
                key={index}
                config={config}
                data={dataPoints(index)}
                colors={config[`${dimVal}_color_range`]}
                title_display={config.display_title}
                title={
                  config[`title_override_${dimensionsRows(index)[0].value}`]
                }
                range={[0, 100]} //needs variable value
                value_format={config.valueFormat}
                formatted_value={formattedValue}
                percentage={true}
              />
            );
          })}
        </MultipleGaugeGrid>
      </MultipleGaugeWrapper>
    );

    // Finally update the state with our new data
    this.chart = ReactDOM.render(<MultipleGaugeItems />, element);

    // We are done rendering! Let Looker know.
    done();
  }
});
