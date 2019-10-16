import React, { Component } from "react";
import styled from "styled-components";
import * as d3 from "d3";

class GaugeChart extends Component {
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

  componentDidUpdate() {
    this.renderGauge();
  }

  getGauge() {
    let self = this; // save reference
    let CONFIG = this.props.config;
    let DATA = this.props.data;
    let width = this.props.width;
    let height = this.props.height;
    let colors = this.props.colors;
    let containerHeight = this.props.containerHeight;

    let target = this.props.target;
    let title = this.props.title;
    let title_display = this.props.title_display;
    let arc_range = this.props.range;
    let value_format = this.props.value_format;
    let formatted_value = this.props.formatted_value;
    let percentage = this.props.percentage;

    let size =
      window.innerWidth > window.innerHeight
        ? window.innerHeight
        : window.innerWidth;
    const displayLabels = size >= 300;
    if (displayLabels) {
      size -= Math.round(size * 0.4);
    }

    return container => {
      //Default Values
      var default_config = {
        size: 710,
        clipWidth: width,
        clipHeight: height,
        ringInset: 45,
        ringInset2: 5,
        ringWidth2: 1,
        pointerWidth: 10,
        pointerTailLength: 5,
        pointerHeadLengthPercent: 0.9,
        minAngle: -90,
        maxAngle: 90,
        transitionMs: 750,
        labelInset: 35,
        currentLabelInset: 40,
        smallPointerInset: 15,
        smallPointerWidth: 20,
        labelFormat: d3.format(".1s")
      };

      //Configuration from Props
      var new_config = {
        containerHeight: containerHeight,
        percentage: percentage,
        ringWidth: CONFIG.thickness,
        segments: CONFIG.segments,
        font_size_arc: CONFIG.font_size_arc,
        font_size_main: CONFIG.font_size_main,
        title: title,
        main_value: DATA,
        formatted_value: formatted_value,
        title_display: title_display,
        font_size_title: CONFIG.font_size_title,
        font_size_target: CONFIG.font_size_target,
        value_format: value_format,
        target_display: CONFIG.target_display,
        target_value: target,
        target_label: CONFIG.target_label,
        target_color: CONFIG.target_color,
        color_by: CONFIG.color_by,
        colors: colors,
        arc_range: arc_range,
        enable_drilling: CONFIG.enable_drilling,
        kFormatter: CONFIG.kformatter,
        target_label: CONFIG.target_label,
        arcColorFn: d3.interpolateHsl(d3.rgb(colors[0]), d3.rgb(colors[1]))
      };
      const config = { ...default_config, ...new_config };

      var range = undefined;
      var r = undefined;
      var pointerHeadLength = undefined;

      var svg = undefined;
      var arc = undefined;
      var percentageBG = undefined;
      var percentageFG = undefined;
      var targetArc = undefined;
      var scale = undefined;
      var ticks = undefined;
      var tickData = undefined;
      var text = undefined;
      var percentageData = undefined;

      const dataPoints = [
        {
          value: config.main_value.value
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
          .domain(config.arc_range ? config.arc_range : [0, 10000]);

        ticks = scale.ticks(config.segments);
        tickData = d3.range(config.segments).map(function() {
          return 1 / config.segments;
        });

        //Target Values
        percentageData = [
          [config.pointerWidth / 2, 0],
          [0, -pointerHeadLength],
          [-(config.pointerWidth / 2), 0],
          [0, config.pointerTailLength],
          [config.pointerWidth / 2, 0]
        ];

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
          .attr("width", "100%")
          .attr("height", config.containerHeight)
          .attr(
            "viewBox",
            "0" + " " + "0" + " " + config.clipWidth + " " + config.clipHeight
          );
        //.attr("preserveAspectRatio", "xMinYMin meet");

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
                ? config.colors[i]
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
        if (displayLabels == true) {
          var lg = svg.append("g").attr("transform", centerTx);
          lg.selectAll("text")
            .data(ticks)
            .enter()
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", config.font_size_arc + "px")
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

          lg.select("text:first-child")
            .attr("text-anchor", "start")
            .attr(
              "transform",
              "rotate(0) translate(-" +
                (config.clipWidth / 2 - config.ringInset) +
                ",20)"
            );

          lg.select("text:last-child")
            .attr("text-anchor", "end")
            .attr(
              "transform",
              "rotate(0) translate(" +
                (config.clipWidth / 2 - config.ringInset) +
                ",20)"
            );
        }

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

        var pointerLine = d3.line().curve(d3.curveLinear);

        if (config.percentage === false) {
          //Render Pointer
          var pg = svg
            .append("g")
            .data([lineData])
            .attr("class", "pointer")
            .attr("transform", centerTx);

          self._d3_refs.pointer = pg
            .append("path")
            .attr("d", pointerLine)
            .attr("transform", "rotate(" + config.minAngle + ")");
        } else {
          var ratio = scale(config.main_value[0].value * 100);
          var newAngle = deg2rad(config.minAngle + ratio * range);

          percentageBG = d3
            .arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(-90 * (Math.PI / 180))
            .endAngle(90 * (Math.PI / 180));

          var percentageBlock = svg.append("g").attr("transform", centerTx);

          self._d3_refs.percentageBG = percentageBlock
            .append("path")
            .attr("class", "percentage_bg")
            .attr("d", percentageBG)
            .attr("fill", config.colors[0]);

          percentageFG = d3
            .arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(-90 * (Math.PI / 180))
            .endAngle(newAngle);

          self._d3_refs.percentageFG = percentageBlock
            .append("path")
            .attr("class", "target")
            .attr("d", percentageFG)
            .attr("fill", config.colors[1]);
        }

        //Render Target Pointer
        var smallPointer = svg
          .append("g")
          .attr("class", "tickline")
          .attr("transform", centerTx);
        if (config.target_display == true) {
          self._d3_refs.sp = smallPointer
            .append("path")
            .attr("class", "target")
            .attr("d", pointerLine(targetData))
            .attr("transform", "rotate(" + config.minAngle + ")")
            .attr("fill", config.target_color);
        }

        function kFormatter(num) {
          return Math.abs(num) > 999
            ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
            : Math.sign(num) * Math.abs(num);
        }
        if (displayLabels == true) {
          //Renders Big Value
          var bigValue = svg
            .append("text")
            .text(config.formatted_value)
            .attr(
              "transform",
              config.percentage === false
                ? "translate(" + r + "," + (r + 70) + ")"
                : centerTx
            )
            .attr("text-anchor", "middle")
            .attr("font-size", config.font_size_main + "px")
            .attr("fill", "#3a4245")
            .attr("class", "looker-vis-context-value-text");
        }

        //Create the title for the legend
        if (config.title_display === true && displayLabels) {
          text = svg
            .append("text")
            .text(config.title)
            .attr(
              "transform",
              config.percentage === false
                ? "translate(" + r + "," + (r + 120) + ")"
                : "translate(" + r + "," + (r + 50) + ")"
            )
            .attr("text-anchor", "middle")
            .attr("font-size", config.font_size_title)
            .attr("font-weight", 100)
            .attr("fill", "#3a4245")
            .attr("class", "looker-vis-context-title-text");
        }

        //Renders Target if enabled
        if (config.target_display === true && displayLabels) {
          text = svg
            .append("text")
            .attr("class", "target__title")
            .attr(
              "transform",
              "translate(" +
                (config.clipWidth - 120) +
                "," +
                config.font_size_target +
                ")"
            )
            .attr("text-anchor", "middle")
            .attr("font-size", config.font_size_target)
            .attr("fill", config.target_color)
            .text(config.target_label + " " + kFormatter(config.target_value));
        }

        update(newValue === undefined ? 0 : newValue);
      }

      //Updates Gauge with new Values
      function update() {
        var amount = config.percentage
          ? config.main_value[0].value * 100
          : config.main_value[0].value;
        var ratio = scale(amount);
        var newAngle = config.minAngle + ratio * range;

        var secondValueRatio = scale(
          config.target_value > config.maxValue
            ? config.maxValue
            : config.target_value
        );
        var secondValueAngle = config.minAngle + secondValueRatio * range;

        if (config.target_display == true) {
          self._d3_refs.sp
            // .transition()
            // .duration(config.transitionMs)
            // .ease(d3.easeExpOut)
            .attr("transform", "rotate(" + secondValueAngle + ")");
        }

        if (config.percentage === false) {
          self._d3_refs.pointer
            // .transition()
            // .duration(config.transitionMs)
            // .ease(d3.easeExpOut)
            .attr("transform", "rotate(" + newAngle + ")");
        } else {
          self._d3_refs.percentageBG
            .transition()
            .duration(config.transitionMs)
            .ease(d3.easeExpOut);

          self._d3_refs.percentageFG
            .transition()
            .duration(config.transitionMs)
            .ease(d3.easeExpOut);
        }
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
    const GaugeChartWrapper = styled.div`
      text-align: center;
    `;
    return <GaugeChartWrapper ref={ref => (this.gaugeDiv = ref)} />;
  };
}

export default GaugeChart;
