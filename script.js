
let chart_width = 1000;
let chart_height = 200;
let description_width = 0;

let chart_margin = { left: 50, right: 100, top: 10, bottom: 30 };
let graphic_margin = {top: 10}
let startDate = new Date(2026, 5, 5, 13, 0);
let endDate = new Date(2026, 5, 5, 16, 30);

const locColors = d3.scaleOrdinal(["1", "2"], ["#FF00FF", "#0000FF"]);
const collection_locations = [
  {
    name: "1", 
    lat: 55.9441945354757,
    lon: -3.188092775019997,
    index: 0
  },
  {
    name: "2", 
    lat: 55.94323006984669,
    lon: -3.1895204830246358,
    index: 1
  }
]

let location1, location2;

async function setup(){
	noCanvas()
	await processData();

  	let chart = createAxis("Heat Index")
  	heatIndexData(chart)
	createMap()
  	
  	chart = createAxis("differences")
}

function createAxis (des){
	let container = `#${des.replace(" ", '')}`
	let svg = d3.select(container).append("svg")
      .attr("viewBox", [0, 0, chart_width, chart_height])
      .attr("width", chart_width)
      .attr("height", chart_height)
      .attr("style", "max-width: 100%; height: auto;");

    let chartContainer = svg.append("g").attr("transform", ()=>{ return "translate(" + 0 + ", " + graphic_margin.top + ")";})
    let scaleX = d3.scaleTime([startDate, endDate], [chart_margin.left, chart_width - chart_margin.right]);
  	let xAxis = d3.axisBottom(scaleX)
  	// .ticks(d3.timeMinute.every(5));
  	
  	svg.append('g')
        .attr('class', 'x-axis')
        .style("font-family", "monospace")
        .attr('transform', `translate(0,${chart_height- 30})`)
        .call( xAxis )

    let chart = svg.append("g");
    let circleRadius = 2;

    let yScale = des == "differences" ? [-5, 5] : [d3.min(location2.concat(location1), (d)=>d[des])-.5, d3.max(location2.concat(location1), (d)=>d[des])+.5];  
    let scaleY = d3.scaleLinear(yScale, [chart_height-chart_margin.bottom,chart_margin.top])
    let yAxis = d3.axisLeft(scaleY).tickArguments([5]);

    chart.append('g')
        .attr('class', 'y-axis')
        .style("font-family", "monospace")
        .attr('transform', `translate(${chart_margin.left},0)`)
        .call( yAxis )

    chart
		.append("text")
		.attr("class", "yaxislabel")
		.style("font-family", "monospace")
		.style('font-size', "10px")
		.attr("text-anchor", "middle")  
		.attr("x", () => { return -chart_height/2})
			.attr("y", () => { return 7}) 
		.attr("transform", "rotate(-90)")
		.text(() => {return des == "differences" ? des + " (C°)" : des + " (" + designations[des].units + ")"})

    
	let designation = designations[des].values;

	if(des == "Heat Index"){
		chart.selectAll("HeatIndex")
	      .data(designation)
	      .join("rect")
	        .attr("class", d => "HeatIndex")
	        .attr("x", d => { return chart_margin.left})     
	        .attr("y", d => scaleY(d["max"]))
	        .attr("width", d => { return chart_width - chart_margin.left - chart_margin.right + description_width})   
	        .attr("height", d => scaleY(d["min"]) - scaleY(d["max"]))
	        .attr("fill", (d,i) => d.color)

	    chart.selectAll("HeatIndex" + "Label")
	      .data(designation)
	      .join("text")
	      .attr("x", d => { return chart_width - chart_margin.right + 15})     
	      .attr("y", d => scaleY(d["max"]) + 13)
	      .style("font-family", "monospace")
	      .style('font-size', "10px")
	      .attr("fill", (d) => (d3.color(d.color).darker(1)))
	      .text((d) => d.Classification)

	    let labels = chart.selectAll("HeatIndex" + "Locations")
	      .data([location1, location2])
	      .join("g")
	      .attr("transform", (d) => `translate(${scaleX(d[d.length-1].date)},${scaleY(d[d.length-1][des])})`)

	    labels.append("circle")
	    	.attr("r", 7)
	    	.attr("stroke", (d) => locColors(d[0].location))
	    	.attr("fill", "transparent")

	    labels.append("text")
	      .text((d) => "location " + d[0].location)
	      .attr("transform", (d) => `translate(${10},${5})`)

	    const line = d3.line().x((d) => scaleX(d.date)).y((d) => {return scaleY(d[des])});
	    let lines = chart
	                  .append("g").selectAll(".line").data([location1, location2])
	                  .join("path").attr("d", (d) => line(d) ).attr("stroke", (d)=>locColors(d[0].location)).attr("fill", "transparent").attr("stroke-width", .5);

	} else if (des == "differences") {
		let differences = [];
		location1.forEach((d) => {
			console.log(d.date.getTime())
			let match = location2.find((v) => v.date.getTime() === d.date.getTime())
			if(match){
				differences.push({
					date: d.date,
					difference: d["Heat Index"] - match["Heat Index"]
				})
			}
		})

		chart.selectAll("differencesRects").data(differences).join("rect")
	        .attr("x", d => scaleX(d.date))
	        .attr("y", d => scaleY(Math.max(d.difference, 0)))
	        .attr("height", d => Math.abs(scaleY(d.difference) - scaleY(0)))
	        .attr("width", 10)
	        .attr("fill", d => d.difference > 0 ? "red" : "blue").attr("stroke-width", 0);

	    chart.append("line").attr("x1", scaleX(startDate)).attr("y1", scaleY(0)).attr("x2", scaleX(endDate)).attr("y2", scaleY(0)).attr("stroke", "#000").attr("stroke-dasharray", "4 1").attr("stroke-width", "0.5");

	    chart.append("text").text((d) => "location 1 hotter")
	    	.attr("fill", "red")
	      	.attr("transform", (d) => `translate(${scaleX(startDate) + 10},${scaleY(0)-10})`)

	    chart.append("text").text((d) => "location 1 colder")
	    	.attr("fill", "blue")
	      	.attr("transform", (d) => `translate(${scaleX(startDate) + 10},${scaleY(0)+17.5})`)
	}

    return chart;
}

function createMap(){
	let mapcontainer = document.querySelector("#mapcontainer")
	const map = L.map(mapcontainer, {boxZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: false, zoomControl: false, dragging: false, scrollWheelZoom: false}).setView([55.943738623653616, -3.188825959330503], 17);

	L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
	attribution: "© <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a> contributors"
	}).addTo(map);

	d3.selectAll("img.leaflet-tile").style("filter", "opacity(0.8)")
  	d3.selectAll(".leaflet-container").style("background-color", "#FFF")
  
	L.svg({clickable:true}).addTo(map)
	const overlay = d3.select(map.getPanes().overlayPane)
	const svg = overlay.select('svg').attr("pointer-events", "auto")

	const Dots = svg.selectAll('circle')
                  .attr("class", "Dots")
                  .data(collection_locations) 
                  .join('g')
                  .attr("transform", d => {return "translate(" + map.latLngToLayerPoint([d.lat, d.lon]).x + "," + map.latLngToLayerPoint([d.lat, d.lon]).y +")"})

        Dots.append("circle")
              .attr("class", "dotties")
              .attr("fill", "transparent") 
              .attr("stroke", (d) => locColors(d))
              .attr("r", 7)
              .on('mouseover', function() { 
                  d3.select(this).transition() 
                    .duration('150') 
                    .attr('r', 8) 
                })
                .on('mouseout', function() { 
                  d3.select(this).transition()
                    .duration('150')
                    .attr('r', 7)
                });
  
        Dots.append("text")
            .attr("class", "yaxislabel")
            .style("font-family", "monospace")
            .style('font-size', "12px")
            .text((d) => {return "location " + d.name})
            .attr("x", () => { return 15})
            .attr("y", () => { return 4})
           //  .attr("x", () => { return -chart_height/2})
          	// .attr("y", () => { return chart_margin.left/3.5}) 

  const update = () => Dots
              .attr("transform", d => {return "translate(" + map.latLngToLayerPoint([d.lat, d.lon]).x + "," + map.latLngToLayerPoint([d.lat, d.lon]).y +")"}) 

  map.on("zoomend", update)
}

function heatIndexData(chart){
	
}

async function processData(){
	location1 = await d3.csv("1 - 3014028 Kestrel datalog export.csv", d3.autoType); 
	location1 = location1.map((d) => {
		d.date = processDate(d["FORMATTED DATE_TIME"])
		d["Heat Index"] = (d["Heat Index"] - 32) / 1.8
		d.location = "1"
		return d
	})
	location1 = d3.filter(location1, (d) => d.date > startDate && d.date < endDate)
	location2 = await d3.csv("2 - 3003694 Kestrel datalog export.csv", d3.autoType); 
	location2 = location2.map((d) => {
		d.date = d.date = processDate(d["FORMATTED DATE_TIME"]);
		d["Heat Index"] = (d["Heat Index"] - 32) / 1.8
		d.location = "2";
		return d;
	})
	location2 = d3.filter(location2, (d) => d.date > startDate && d.date < endDate);
}

function processDate(string){
	let unformattedDate = string.split(" ");
	let dateString = `${unformattedDate[0]}T${unformattedDate[1]}`
	let workingDate = new Date(dateString);
	let hour = workingDate.getHours();
	if(hour < 12 && unformattedDate[2] == "pm"){ workingDate.setHours(hour + 12) }
	return workingDate;
}

function draw(){}

let designations = {
  "Heat Index" : {
      units: "°C",
      unitsShort: "°",
      values: [
        {
          "min": "80",
          "max": "90",
          "Classification": "Caution",
          "Effect": "Fatigue possible with prolonged exposure and / or physical activity",
          "color": "#FFFDDE"
        },
        {
          "min": "90",
          "max": "103",
          "Classification": "Extreme caution",
          "Effect": "Heat stroke, heat cramps, or heat exhaustion possi…ith prolonged exposure and / or physical activity",
          "color": "#FFEFDE"
        },
        {
          "min": "103",
          "max": "110",
          "Classification": "Danger",
          "Effect": "Heat cramps or heat exhaustion likely, and heat st…ith prolonged exposure and / or physical activity",
          "color": "#FFDFDE"
        }
      ] },
  "differences" :{},
  
  // ,
    //  "Wet bulb" : {
    //     units: "°F",
    //     unitsShort: "°",
    //     source: "Grundstein et al. 2015",
    //     values: [
    //       {
    //         "min": "70",
    //         "max": "78.3",
    //         "Classification": "Low",
    //         "Effect": "Fatigue possible with prolonged exposure and / or physical activity",
    //         "color": "#E9FFDE"
    //       },
    //       {
    //         "min": "78.3",
    //         "max": "82.0",
    //         "Classification": "Elevated",
    //         "Effect": "Fatigue possible with prolonged exposure and / or physical activity",
    //         "color": "#FFFDDE"
    //       },
    //       {
    //         "min": "82.0",
    //         "max": "86",
    //         "Classification": "Moderate",
    //         "Effect": "Heat stroke, heat cramps, or heat exhaustion possi…ith prolonged exposure and / or physical activity",
    //         "color": "#FFEFDE"
    //       },
    //       {
    //         "min": "86",
    //         "max": "90",
    //         "Classification": "High",
    //         "Effect": "Heat cramps or heat exhaustion likely, and heat st…ith prolonged exposure and / or physical activity",
    //         "color": "#FFDFDE"
    //       },
    //       {
    //         "min": "90",
    //         "max": "95",
    //         "Classification": "Extreme",
    //         "Effect": "Heat cramps or heat exhaustion likely, and heat st…ith prolonged exposure and / or physical activity",
    //         "color": "#ddd"
    //       }
    //     ]
    // }
}