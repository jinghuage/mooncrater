
//global variables
var width = 960,
    height = 500, 
    margins = {top:20, right:20, bottom:20, left:60},
    xRange = d3.scale.linear().range([margins.left, width-margins.right]),
    yRange = d3.scale.linear().range([height-margins.top, margins.bottom]),
    rRange = d3.scale.linear().range([1, 20]), // radius range function - ensures the radius is between 5 and 20
    currentDataset,
    rawData,
    drawingData,
    xAxis = d3.svg.axis().scale(xRange).tickSize(16).orient("bottom").tickSubdivide(true),
    yAxis = d3.svg.axis().scale(yRange).tickSize(10).orient("right").tickSubdivide(true),
    svg;




// script body
// runs once when the visualization loads
function init() {


    //svg=d3.select("body").append("svg").attr("width",width).attr("height",height);
    svg = d3.select("#visualisation");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    update();
}




// this redraws the visualization
function redraw() {
    var craters = svg.selectAll("circle").data(drawingData, function(d){ return d.id; }),
    axes = getAxes();

    console.log(axes);
    console.log(drawingData);

    var gradecolor=d3.scale.category20().domain(["AA","SF","DO","LC","MO", "PR", "RI", "AL", "RU", "LF", "VA"]);


    xRange.domain([
        d3.min(drawingData, function(d){return +d[axes.xAxis];}),
        d3.max(drawingData, function(d){return +d[axes.xAxis];})
        ]);

    yRange.domain([
        d3.min(drawingData, function(d){return +d[axes.yAxis];}),
        d3.max(drawingData, function(d){return +d[axes.yAxis];})
        ]);

    rRange.domain([
        d3.min(drawingData, function(d){return +d[axes.radiusAxis];}),
        d3.max(drawingData, function(d){return +d[axes.radiusAxis];})
        ]);


    craters.enter()
    .insert("svg:circle")
    .attr("cx", function(d){return xRange(+d[axes.xAxis]);})
    .attr("cy", function(d){return yRange(+d[axes.yAxis]);})
    .style("opacity", 0)
    .style("fill", function(d){return gradecolor(d.grade);})
    .append("title")
    .text(function(d){return d.name;});


    var t = svg.transition().duration(1500).ease("exp-in-out");
    //select class, don't put blank space in-between two classes
    t.select(".x.axis").call(xAxis);
    t.select(".y.axis").call(yAxis);
    
    craters.transition().duration(1500).ease("exp-in-out")
    .attr("cx", function(d){return xRange(+d[axes.xAxis]);})
    .attr("cy", function(d){return yRange(+d[axes.yAxis]);})
    .attr("r",  function(d){return rRange(+d[axes.radiusAxis]);})
    .style("opacity", 1)
    .style("fill", function(d){return gradecolor(d.grade);});

    craters.exit()
    .transition().duration(1500).ease("")
    .attr("r", 0)
    .style("opacity", 0)
    .remove();
}


// let's kick it all off!
init ();



////////////////////
// helper functions
////////////////////



// take a string and turn it into a WordPress style slug
function slugify (string) {
	return string.replace (/([^a-z0-9])/ig, '-').toLowerCase ();
}


// return the name of the dataset which is currently selected
function getChosenDataset () {
    var select = document.getElementById("dataset");
    return select.options[select.selectedIndex].value;
}


// get selected x axes
function getXAxes() {
    return document.querySelector("#x-axis input:checked").value;
}


// return an object containing the currently selected axis choices
function getAxes () {
	var x = document.querySelector("#x-axis input:checked").value,
		y = document.querySelector("#y-axis input:checked").value,
		r = document.querySelector("#r-axis input:checked").value;
	return {
		xAxis: x,
		yAxis: y,
		radiusAxis: r
	};
}


// after analysis, dirty data is considered to be that which can't be converted
// to a number
function isDirty (data) {
	var clean = "latitude longitude size surfacedepth".split(" ").every (function (attribute) {
		return !isNaN (+data[attribute]) ;
	});
	return !clean;
}


// return a list of types which are currently selected
function plottableTypes () {
	var types = [].map.call (document.querySelectorAll ("#crater-types input:checked"), function (checkbox) { return checkbox.value;} );
	return types;
}

// Transpose the data into layers wanted.
// For histogram vis
function transposeData(data) {    
    var lrs = ["latitude", "longitude", "size", "surfacedepth"].map(function(l) {
        return data.map(function(d) {
            return +d[l];
        });
    });

}

  
// take a raw dataset and remove craters which shouldn't be displayed
// (i.e. if it is "dirty" or it's type isn't selected)
// 
function processData (data) {
    var processed = [],
    cullDirty = document.getElementById("cull-dirty").checked;
    //craterTypes = {},
    //counter = 1;

    data.forEach (function (data, index) {
	var crater,
	className = "";
	if (!(cullDirty && isDirty(data))) { // don't process it if it's dirty and we want to cull dirty data
	    crater = { id: index }; // so that the craters can animate
	    
	    for (var attribute in data) {
		if (data.hasOwnProperty (attribute)) {
		    crater[attribute] = data[attribute]; // populate the crater object
		}
	    }
	    

	    processed.push (crater); // add the coaster to the output
	}
    });

    return processed; // only contains coasters we're interested in visualising
}



// remove craters whose type is not selected from a dataset
function cullUnwantedTypes (craters) {
    var typesToDisplay = plottableTypes ();

    return craters.filter (function (crater) {
	return typesToDisplay.indexOf(crater.grade) !== -1;
    });
}



// called every time a form field has changed
function update () {
    var dataset = getChosenDataset(), // filename of the chosen dataset csv
    processedData; // the data while will be visualised

    //for debug
    console.log(dataset);

    // if the dataset has changed from last time, load the new csv file
    if (dataset != currentDataset) {
	d3.csv(dataset + ".csv", function (data) {
	    // process new data and store it in the appropriate variables
	    rawData = data;
	    processedData = processData(data);
	    currentDataset = dataset;
	    
            //here we only visualize checked crater types (grade)
            //todo: sort the data points by crater type (grade), 
            //and plot the later added types on top of existing plotted types
	    drawingData = cullUnwantedTypes(processedData);
	    redraw();
	});
    } else {
	// process data based on the form fields and store it in the appropriate variables
	processedData = processData(rawData);
	drawingData = cullUnwantedTypes(processedData);
	redraw();
    }
}


// listen to the form fields changing
document.getElementById("cull-dirty").addEventListener ("change", update, false);
document.getElementById("dataset").addEventListener ("change", update, false);
document.getElementById("controls").addEventListener ("click", update, false);
document.getElementById("controls").addEventListener ("keyup", update, false);

