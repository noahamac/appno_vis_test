import React, { Component } from "react";
import styled from "styled-components";
import * as d3 from "d3";

const GaugeChartWrapper = styled.div`
  text-align: center;
  font-family: "Open Sans", "Noto Sans JP", "Noto Sans", "Noto Sans CJK KR",
    Helvetica, Arial, sans-serif;
  color: #3a4245;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

class MultipleGaugeCharts extends Component {
  constructor(props) {
    super(props);
    // list of d3 refs to share within the components
    this._d3_refs = {
      powerGauge: false
    };
    this.initialValue = 0;
  }

  componentDidMount() {
    this.renderGauge();
  }

  componentWillReceiveProps() {
    //   // update the initial value

    this.initialValue = this.props.value || 0;
  }

  componentWillUpdate() {}

  componentDidUpdate() {
    this.renderGauge();
  }

  getGauge() {
    let self = this; // save reference
    let CONFIG = this.props.config;
    let DATA = this.props.data;

    return container => {
      //Hard Coded Values
      var default_config = {
        size: 500,
        clipWidth: 500,
        clipHeight: 450,
        ringInset: 45,
        ringInset2: 5,
        ringWidth2: 1,
        pointerWidth: 10,
        pointerTailLength: 5,
        pointerHeadLengthPercent: 0.9,
        minValue: CONFIG.range[0],
        maxValue: CONFIG.range[1],
        minAngle: -90,
        maxAngle: 90,
        transitionMs: 750,
        labelInset: 35,
        currentLabelInset: 40,
        smallPointerInset: 15,
        smallPointerWidth: 20,
        labelFormat: d3.format(",.2r")
      };

      //Configuration from Props
      var new_config = {
        ringWidth: CONFIG.thickness,
        segments: CONFIG.segments,
        font_size_arc: CONFIG.font_size_arc,
        font_size_main: CONFIG.font_size_main,
        title: CONFIG.title,
        font_size_title: CONFIG.font_size_title,
        value_format_display: CONFIG.value_format_display,
        value_format: CONFIG.value_format,
        value_format_position: CONFIG.value_format_position,
        value_format_spacing: CONFIG.value_format_spacing,
        target_display: CONFIG.target_display,
        target_value: CONFIG.target_value,
        target_label: CONFIG.target_label,
        target_color: CONFIG.target_color,
        color_by: CONFIG.color_by,
        color_range: CONFIG.color_range,
        enable_drilling: CONFIG.enable_drilling,
        arcColorFn: d3.interpolateHsl(
          d3.rgb(CONFIG.color_range[0]),
          d3.rgb(CONFIG.color_range[1])
        )
      };
      const config = { ...default_config, ...new_config };

      var range = undefined;
      var r = undefined;
      var pointerHeadLength = undefined;

      var svg = undefined;
      var arc = undefined;
      var targetArc = undefined;
      var scale = undefined;
      var ticks = undefined;
      var tickData = undefined;
      var text = undefined;

      const dataPoints = [
        {
          value: DATA[0].value
        }
      ];

      function deg2rad(deg) {
        return (deg * Math.PI) / 180;
      }

      function configure() {
        range = config.maxAngle - config.minAngle;
        r = config.size / 2;

        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);
        scale = d3
          .scaleLinear()
          .range([0, 1])
          .domain([config.minValue, config.maxValue]);

        ticks = scale.ticks(config.segments);
        tickData = d3.range(config.segments).map(function() {
          return 1 / config.segments;
        });

        // Create Main Arc
        arc = d3
          .arc()
          .innerRadius(r - config.ringWidth - config.ringInset)
          .outerRadius(r - config.ringInset)
          .startAngle(function(d, i) {
            var ratio = d * i;
            return deg2rad(config.minAngle + ratio * range);
          })
          .endAngle(function(d, i) {
            var ratio = d * (i + 1);
            return deg2rad(config.minAngle + ratio * range);
          });

        // Create Target Arc

        config.target_display == true
          ? (targetArc = d3
              .arc()
              .innerRadius(r - config.ringWidth2 - config.ringInset2)
              .outerRadius(r - config.ringInset2)
              .startAngle(-90 * (Math.PI / 180))
              .endAngle(90 * (Math.PI / 180)))
          : null;
      }

      function centerTranslation() {
        return "translate(" + r + "," + r + ")";
      }

      function isRendered() {
        return svg !== undefined;
      }

      //Render the actual component
      function render(newValue) {
        svg = d3
          .select(container)
          .append("svg:svg")
          .attr("class", "gauge")
          .attr("width", config.clipWidth)
          .attr("height", config.clipHeight);

        var centerTx = centerTranslation();

        //Render Main Arc
        var arcs = svg
          .append("g")
          .attr("class", "arc")
          .attr("transform", centerTx);

        arcs
          .selectAll("path")
          .data(tickData)
          .enter()
          .append("path")
          .attr("fill", function(d, i) {
            const newColors =
              config.color_by == "segment" // if color by segment?
                ? config.color_range[i]
                : config.arcColorFn(d * i); // else color by range
            return newColors;
          })
          .attr("d", arc);

        //Render Target Arc
        var targetArcs = svg
          .append("g")
          .attr("class", "arc")
          .attr("transform", centerTx);

        targetArcs
          .append("path")
          .attr("d", targetArc)
          .attr("fill", config.target_color);

        //Render Segment Values Arc
        var lg = svg.append("g").attr("transform", centerTx);
        lg.selectAll("text")
          .data(ticks)
          .enter()
          .append("text")
          .attr("font-size", config.font_size_arc)
          .attr("fill", "#3a4245")
          .attr("transform", function(d) {
            var ratio = scale(d);
            var newAngle = config.minAngle + ratio * range;
            return (
              "rotate(" +
              newAngle +
              ") translate(0," +
              (config.labelInset - r) +
              ")"
            );
          })
          .text(config.labelFormat);

        //Pointer Values
        var lineData = [
          [config.pointerWidth / 2, 0],
          [0, -pointerHeadLength],
          [-(config.pointerWidth / 2), 0],
          [0, config.pointerTailLength],
          [config.pointerWidth / 2, 0]
        ];

        //Target Values
        var targetData = [
          [0, config.smallPointerInset - r],
          [
            -config.smallPointerWidth / 2,
            config.smallPointerInset - r - config.smallPointerWidth / 2
          ],
          [
            config.smallPointerWidth / 2,
            config.smallPointerInset - r - config.smallPointerWidth / 2
          ]
        ];

        //Render Pointer
        var pointerLine = d3.line().curve(d3.curveLinear);
        var pg = svg
          .append("g")
          .data([lineData])
          .attr("class", "pointer")
          .attr("transform", centerTx);

        self._d3_refs.pointer = pg
          .append("path")
          .attr("d", pointerLine)
          .attr("transform", "rotate(" + config.minAngle + ")");

        //Render Target Pointer
        var smallPointer = svg
          .append("g")
          .attr("class", "tickline")
          .attr("transform", centerTx);

        config.target_display
          ? (self._d3_refs.sp = smallPointer
              .append("path")
              .attr("class", "target")
              .attr("d", pointerLine(targetData))
              .attr("transform", "rotate(" + config.minAngle + ")")
              .attr("fill", config.target_color))
          : null;

        //Formmatted values (1000 = 1,000)
        let firstDataValue = dataPoints[0].value;
        let formattedNumber = new Intl.NumberFormat().format(firstDataValue);

        let targetValue = config.target_value;
        let formattedTargetValue = new Intl.NumberFormat().format(targetValue);

        //Checks Format Value Position
        function checkBigValTypePosition() {
          return config.value_format_position == "before"
            ? config.value_format + checkBigValTypeSpacing() + formattedNumber
            : formattedNumber + checkBigValTypeSpacing() + config.value_format;
        }

        //Checks if Format Value need spacing
        function checkBigValTypeSpacing() {
          return config.value_format_spacing ? " " : "";
        }

        //Renders Big Value
        var bigValue = svg
          .append("text")
          .text(
            config.value_format_display
              ? checkBigValTypePosition()
              : formattedNumber
          )
          .attr("y", 330)
          .attr("x", config.clipWidth / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", config.font_size_main + "px")
          .attr("fill", "#3a4245");

        bigValue.selectAll("text").append("span");

        //Create the title for the legend
        var title = svg
          .append("text")
          .text(config.title)
          .attr("y", 400)
          .attr("x", config.clipWidth / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", config.font_size_title)
          .attr("font-weight", 100)
          .attr("fill", "#3a4245")
          .attr("class", "looker-vis-context-title-text");

        title.selectAll("text").append("span");

        //Renders Target if enabled
        config.target_display === false
          ? null
          : (text = svg
              .append("text")
              .attr("class", "target__title")
              .attr("transform", "translate(90,0)")
              .attr("x", config.clipWidth - 200)
              .attr("y", 20)
              .attr("font-size", "16px")
              .attr("fill", config.target_color)
              .text("Target= " + formattedTargetValue));

        update(newValue === undefined ? 0 : newValue);
      }

      //Updates Gauge with new Values
      function update(newValue) {
        var ratio = scale(dataPoints[0].value);
        var newAngle = config.minAngle + ratio * range;

        var secondValueRatio = scale(config.target_value);
        var secondValueAngle = config.minAngle + secondValueRatio * range;

        config.target_display
          ? self._d3_refs.sp
              .transition()
              .duration(config.transitionMs)
              .ease(d3.easeElastic)
              .attr("transform", "rotate(" + secondValueAngle + ")")
          : null;

        self._d3_refs.pointer
          .transition()
          .duration(config.transitionMs)
          .ease(d3.easeElastic)
          .attr("transform", "rotate(" + newAngle + ")");
      }

      configure();

      return {
        configure: configure,
        isRendered: isRendered,
        render: render,
        update: update,
        // exposing the config object
        config: config
      };
    };
  }

  renderGauge() {
    d3.select(this.gaugeDiv)
      .select("svg")
      .remove();
    this._d3_refs.powerGauge = this.getGauge()(this.gaugeDiv);
    this._d3_refs.powerGauge.render();
    this.updateReadings();
  }

  updateReadings() {
    // updates the readings of the gauge with the current prop value
    // animates between old prop value and current prop value
    this._d3_refs.powerGauge.update();
  }
  render = () => {
    return <GaugeChartWrapper ref={ref => (this.gaugeDiv = ref)} />;
  };
}

export default MultipleGaugeCharts;
