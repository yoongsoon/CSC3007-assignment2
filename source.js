
/**
    * Darked/Lighten a color
    * Copied from https://stackoverflow.com/a/13532993/10468888
    */
function shadeColor(color, percent) {

  var R = parseInt(color.substring(1, 3), 16);
  var G = parseInt(color.substring(3, 5), 16);
  var B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  var RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
  var GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
  var BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}


/**
 *  Fetch data from api as json
 * @returns a promise
 */
function fetchData() {

  var input_data = {
    resource_id: '83c21090-bd19-4b54-ab6b-d999c251edcf', // the resource id
    limit: 100, // get 100 results
  };

  // Fetch the request and return it as a promise
  let promise = $.ajax({
    url: 'https://data.gov.sg/api/action/datastore_search',
    data: input_data,
    dataType: 'json',
  });

  return promise

}

//fetch json data
let output = fetchData();
// set margin for axes
let margin = { top: 20, right: 20, bottom: 40, left: 40 },
  width = 1200 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// translate chart according to margin
let chart = d3.select("#chart")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Variable initialization
let graph_index = 0;
let is_initialize = false;
var xAxis;
var yAxis;
var tooltip;
var bars;
var colors;

// A function that create / update the plot for a given variable:
function update() {

  output.then(function (data) {

    //array of dictionary records
    records = data.result.records;

    //get all the possible years 
    let years = records.map(item => item.year)
      .filter((value, index, self) => self.indexOf(value) === index)

    //sort year in descending
    years = years.sort().reverse();

    // retrieve all the records associated with that particular year
    let records_for_that_year = records.filter(item => item.year == years[graph_index]);

    //X scale
    let xScale = d3.scaleBand()
      .domain(records_for_that_year.map(function (d) { return d.level_2; }))
      .rangeRound([0, width])
      .padding(0.1);

    //Y scale 
    let yScale = d3.scaleLinear()
      .domain([0, 20000])
      .rangeRound([height, 0]);

    if (is_initialize == false) {

      //Create title
      title = chart.append('text')
      title
        .attr('class', 'title')
        .attr('x', width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .text('Cases Recorded for Selected Major Offences in the Year: ' + years[graph_index])

      // Create X axis
      xAxis = chart.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

      //Create Y axis
      yAxis = chart.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(yScale));

      // create tooltip element  
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "15px")
        .style("background", "rgba(0,0,0,0.6)")
        .style("border-radius", "5px")
        .style("color", "#fff")
        .text("a simple tooltip");

      //colors for bar
      colors = d3.scaleOrdinal(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598",
        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);

      // Create group for the bars
      bars = chart
        .append("g")
      
      is_initialize = true;

    }
    else {
      // Update title
      title.text('Cases Recorded for Selected Major Offences in the Year: ' + years[graph_index]);
    }

    //Increment index
    graph_index += 1

    if (graph_index >= years.length - 1) {
      graph_index = 0;
    }
    
    // For updating the bars with new data
    var rects = bars.selectAll("rect").data(records_for_that_year);
    rects.enter()
      .append("rect")
      .attr("fill", function (d, i) {
        return colors(i);
      })
      .merge(rects)
      .transition()
      .duration(1000)
      .attr("x", function (d) { return xScale(d.level_2); })
      .attr("y", function (d) { return yScale(d.value); })
      .attr("width", xScale.bandwidth())
      .attr("height", function (d) { return height - yScale(d.value); })

    d3.selectAll("rect")
      .on("mouseover", function (d, i) {
        tooltip.html(`Number(case): ${i.value}`).style("visibility", "visible");

        //get index
        index = records_for_that_year.indexOf(i);

        d3.select(this)
          .attr("fill", shadeColor(colors(index), -15));
      })
      .on("mousemove", function () {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function (d, i) {
        tooltip.html(``).style("visibility", "hidden");

        //get index
        index = records_for_that_year.indexOf(i);

        d3.select(this).attr("fill", colors(index));
      })

  });

}








