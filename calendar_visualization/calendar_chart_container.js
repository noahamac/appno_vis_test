
import React from "react";
import ReactDOM from "react-dom";
//import CalendarHM from './calendar_chart' //'./calendar-heatmap.component'
import CalendarHeatmap from './calendar-heatmap.component'
import * as d3 from "d3";
import moment from "moment";



const colorByOps = {
  SEGMENT: "segment",
  RANGE: "range"
};
const baseOptions = {

  // overview: {
  //   type: "string",
  //   label: "Oerview Data",
  //   display: "select",
  //   values: [
  //     { "year": "year" },
  //     { "month": "month" },
  //     { "week": "week" },
  //     { "day": "day" }
  //   ],
  //   default: "year",
  //   section: "Style",
  //   order: 1
  // },
  font_size_title: {
    type: "string",
    label: "Title font size ",
    default: "24",
    section: "Style",
    order: 1
  },
  font_size_date: {
    type: "string",
    label: "Dates font size ",
    default: "16",
    section: "Style",
    order: 2
  },
  target_color: {
    type: "string",
    label: "Calendar Color",
    display: "color",
    default: "red",
    section: "Style",
    order: 3
  },
  sizeshape: {
    type: "number",
    label: "Rectangle size (pixels in daily view)",
    default: 10,
    section: "Style",
    order: 4
  },


  title: {
    type: "string",
    label: "Title ",
    default: "Title",
    section: "Values",
    order: 1
  },
  measure: {
    type: "string",
    label: "Measure ",
    default: "Counts",
    section: "Values",
    order: 2
  },
  tot_measure: {
    type: "string",
    label: "Total Measure Label ",
    default: "Total Counts",
    section: "Values",
    order: 3
  }
};

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "heatmap_chart",
  label: "Calendar Heatmap",
  options: baseOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    this.chart = ReactDOM.render(<div>...Loading</div>, element);
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates
    this.clearErrors();
    
    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (queryResponse.fields.measures.length == 0) {
      this.addError({
        title: "No Measures",
        message: "This chart requires measures."
      });
      return;
    }
    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({
        title: "No Dimensions",
        message: "This chart requires dimensions."
      });
      return;
    }

    // Grab the first cell of the data
    var firstRow = data;

    // RGB: getting the labels on the query response for the specific column values and field names
    // if the query changes, the data source will change, so the functionality should by dinamic
    const dim1  = queryResponse.fields.dimensions[0].name;
    const dim2  = queryResponse.fields.dimensions[1].name;
    const meas1 = queryResponse.fields.measures[0].name;

 
    //let nowtime = moment.max(data.map(function(d){ return d.dim1.value}));
    let reporttime = data.map(d => {return moment(d[dim1].value)} );
    let now    = moment.max(reporttime);
    let time_ago = moment.min(reporttime);       

    var orlist = d3.timeDays(time_ago, now);

    const dataready = orlist.map(function (dateElement, index){//function (datrow, index){
          return {
              date: dateElement,//datrow[dim1].value,moment("2014-02-27T10:00:00").format('DD-MM-YYYY')
              details: data.filter(details => details[dim1].value == moment(dateElement).format('YYYY-MM-DD')).map(function(filrow,err) { 
                  return {
                     'name': filrow[dim2].value,
                     'date': function () {
                      let projectDate = new Date(dateElement.getTime())
                      projectDate.setHours(Math.floor(Math.random() * 24))
                      projectDate.setMinutes(Math.floor(Math.random() * 60))
                      return projectDate
                    }(), //filrow[dim1].value,
                     'value': parseInt(filrow[meas1].value)
                  }}),
                  init: function () {
                    this.total = this.details.reduce(function (prev, e) {
                      return prev + e.value
                    }, 0)
                    return this
                  } 
          }.init()
        });

     const dataclean =  dataready.filter( (ele, ind) => ind === dataready.findIndex( elem => elem.date === ele.date));
     
     const finaldata = dataclean.map(d => {
      let summary = d.details.reduce((uniques, project) => {
        if (!uniques[project.name]) {
          uniques[project.name] = {
            'value': parseInt(project.value)
          }
        } else {
          uniques[project.name].value += project.value
        }
        return uniques
      }, {})
      let unsorted_summary = Object.keys(summary).map(key => {
        return {
          'name': key,
          'value': parseInt(summary[key].value)
        }
      })
      d.summary = unsorted_summary.sort((a, b) => {
        return b.value - a.value
      })
      return d
    });

    //console.log(finaldata);
    if (finaldata.length == 0) {
      this.addError({
        title: "Wrong column order or insufficient data",
        message: "Calendar requires 1st Colum Date, 2nd Colum Category, 3rd Column Measure."
      });
      return;
    }

    
    
    
   
    // Finally update the state with our new data
    this.chart = ReactDOM.render(
  
        <CalendarHeatmap
         data            = {finaldata}
         color           = {config.target_color}
         overview        = {config.overview}
         measure         = {config.measure}
         totmeasure      = {config.tot_measure}
         sizeonday       = {config.sizeshape}
         title           = {config.title}
         font_size_title = {config.font_size_title}
         font_size_date  = {config.font_size_date}
         startdate       = {time_ago}
         enddate         = {now}
        />,
      element
    );

    // We are done rendering! Let Looker know.
    done();
  }
});
