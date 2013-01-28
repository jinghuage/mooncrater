
//global variables
var width = 960,
    height = 500, 
    margins = {top:20, right:20, bottom:20, left:60},
    xRange = d3.scale.linear().range([margins.left, width-margins.right]),
    yRange = d3.scale.linear().range([height-margins.top, margins.bottom]),
    currentDataset,
    rawData,
    drawingData,
    xAxis = d3.svg.axis().scale(xRange).tickSize(16).tickSubdivide(true),
    yAxis = d3.svg.axis().scale(yRange).tickSize(10).orient("right").tickSubdivide(true),
    svg=d3.select("body").append("svg").attr("width",width).attr("height",height);




// script body
// runs once when the visualization loads
function init() {



    var lat=d3.scale.linear().domain([-90, 90]).range([margin,width-margin]);
    var long=d3.scale.linear().domain([0, 360]).range([height-margin,margin]);

    var rad=d3.scale.linear().domain([0,500]).range([0,20]);
    var surfd=d3.scale.linear().domain([1730000,1750000]).range([.5,1]);

    var grade=d3.scale.category20().domain(["AA","SF","DO","LC","MO", "PR", "RI", "AL", "RU", "LF", "VA"]);



    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);

    update();
}




// this redraws the histogram based on X axes selected
function redraw() {

xaxes = getXAxes();


d3.csv("moontest.csv",function(csv) {

  //console.log(csv);

  // Transpose the data into layers wanted.
  var lrs = ["latitude", "longitude", "size", "grade"].map(function(l) {
    return csv.map(function(d) {
      return +d[l];
    });
  }));
  
  //console.log(lrs);
  
  // then we create the marks, which we put in an initial position

  var data = d3.layout.histogram()
      .bins(x.ticks(20))
      (lrs["latitude"]);

  var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

  var formatCount = d3.format(",.0f");

  var bar = svg.selectAll(".bar")
      .data(data)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", function(d) { return x(d.dx) - 1; })
      .attr("height", function(d) { return height - y(d.y); });

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", function(d) { return x(d.dx) / 2; })
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(d.y); });

});

}


// let's kick it all off!
init ();



////////////////////
// helper functions
////////////////////


// update the list of checkboxes which allows the selection of coaster types
function generateTypesList (data) {
	var i = data.length,
		typeNames = {},
		select = document.getElementById("crater-types"),
		list = "";

	// loop though each coaster and check it's type's name. If we haven't seen
	// it before, add it to an object so that we can use it to build the list
	while (i--) {
		if (typeof typeNames[data[i].grade.name] == "undefined") {
			typeNames[data[i].grade.name] = data[i].type.className;
		}
	}
	// loop through the array to generate the list of types
	for (var key in typeNames) {
		if (typeNames.hasOwnProperty(key)) {
			list += '<li class="' + typeNames[key] + '"><label><input type="checkbox" checked="checked" value="' + slugify(key) + '">' + key + '</label></li>';
		}
	}
	// update the form
	select.innerHTML = list;
}


// take a string and turn it into a WordPress style slug
function slugify (string) {
	return string.replace (/([^a-z0-9])/ig, '-').toLowerCase ();
}


// return the name of the dataset which is currently selected
function getChosenDataset () {
	var dataselect = d3.select("#dataset");
	return dataselect.options[select.selectedIndex].value;
}

// get selected x axes
function getXAxes() {
    return document.querySelector("#x-axis input:checked").value;
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


// take a raw dataset and remove craters which shouldn't be displayed
// (i.e. if it is "dirty" or it's type isn't selected)
function processData (data) {
	var processed = [],
		cullDirty = document.getElementById("cull-dirty").checked,
		craterTypes = {},
		counter = 1;

	data.forEach (function (data, index) {
		var crater,
			className = "";
		if (!(cullDirty && isDirty(data))) { // don't process it if it's dirty and we want to cull dirty data
				crater = {
					id: index // so that the craters can animate
				};
			for (var attribute in data) {
				if (data.hasOwnProperty (attribute)) {
					coaster[attribute] = data[attribute]; // populate the coaster object
				}
			}
			if (typeof coasterTypes[data.type] == "undefined") { // generate a classname for the coaster based on it's type (used for styling)
				coasterTypes[data.type] = {
					id: counter - 1,
					className: 'coastertype-' + counter,
					name: data.type,
					slug: slugify(data.type)
				};
				counter = counter + 1;
			}
			coaster.type = coasterTypes[data.type];
			processed.push (coaster); // add the coaster to the output
		}
	});

	return processed; // only contains coasters we're interested in visualising
}



// remove craters whose type is not selected from a dataset
function cullUnwantedTypes (craters) {
	var typesToDisplay = plottableTypes ();

	return craters.filter (function (crater) {
		return typesToDisplay.indexOf(crater.type.slug) !== -1;
	});
}



// called every time a form field has changed
function update () {
    var dataset = getChosenDataset(), // filename of the chosen dataset csv
    processedData; // the data while will be visualised
    // if the dataset has changed from last time, load the new csv file
    if (dataset != currentDataset) {
	d3.csv("data/" + dataset + ".csv", function (data) {
	    // process new data and store it in the appropriate variables
	    rawData = data;
	    processedData = processData(data);
	    currentDataset = dataset;
	    generateTypesList(processedData);
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
d3.select("controls").addEventListener ("click", update, false);
d3.select("controls").addEventListener ("keyup", update, false);

