import React, { Component } from 'react';
import * as d3 from 'd3'
import styled from 'styled-components';

const BubbleChartWrapper = styled.div`
  font-family: 'Open Sans', 'Noto Sans JP', 'Noto Sans', 'Noto Sans CJK KR', Helvetica, Arial, sans-serif;
  text-align: center;
`;

class BubbleChart extends Component {
  componentDidMount() {
    this.drawChartWithParams();
    window.addEventListener('resize', this.drawChartWithParams);
  }

  componentDidUpdate() {
    this.drawChartWithParams();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.drawChartWithParams);
  }

  drawChartWithParams = () => {
    this.drawChart('#chart');
  }

  getWindowSize() {
    return window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
  }

  getFontSize() {
    const windowSize = this.getWindowSize();
    const fontSize = Math.round(windowSize * 0.017);
    return fontSize > 13 ? 13 : fontSize;
  }

  drawChart(id) {
    const { config, data } = this.props;

    const windowSize = this.getWindowSize();
    const fontSize = this.getFontSize();

    var diameter = windowSize - 15,
        format = d3.format(",d"),
        color = d3.scaleOrdinal().range(config.value_colors || []);

    var bubble = d3.pack()
      .size([diameter, diameter])
      .padding(1.5);

    d3.select(id).select("svg").remove();

    var svg = d3.select(id).append("svg")
      .attr("width", diameter)
      .attr("height", diameter)
      .attr("class", "bubble");

    const d = {
      children: data
    }

    var root = d3.hierarchy(d)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.value - a.value; });

    bubble(root);

    var node = svg.selectAll(".node")
      .data(root.children)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
      .text(function(d) { return d.data.itemName + ": " + format(d.value); });

    node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { 
        return color(d.data.color); 
      });

    if (config['value_titles'] !== false) {
      node.append("text")
        .attr("dy", config['value_labels'] === false ? ".3em" : ".1em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.itemName.substring(0, d.r / 3); });
    }

    if (config['value_labels'] !== false) {
      node.append("text")
        .attr("dy", config['value_titles'] === false ? ".3em" : "1.5em")
        .style("font-size", `${fontSize * 0.8}px`)
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.value });
    }

    d3.select(self.frameElement).style("height", diameter + "px");
  }

  render() {
    const fontSize = this.getFontSize();
  
    return (
      <BubbleChartWrapper id='chart'
        style={{ fontSize }}
      />
    );
  }
}

BubbleChart.defaultProps = {
  config: {},
  data: []
}

export default BubbleChart;
