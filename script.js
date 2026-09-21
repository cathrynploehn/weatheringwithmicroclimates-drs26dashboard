
let chart_width = 1000;
let chart_height = 200;
let description_width = 0;

let chart_margin = { left: 50, right: 100, top: 10, bottom: 30 };
let graphic_margin = {top: 10}
let startDate = new Date(2026, 5, 9, 13, 0);
let endDate = new Date(2026, 5, 9, 17, 20);

const fontSize = "12px";
const locColors = d3.scaleOrdinal(["1", "2"], ["#007700", "#FF00FF"]);
const locColorsOpacity = 0.5;
const collection_locations = [
  {
    name: "1", 
    lat: 55.943669978176054,
    lon: -3.1884459069930227,
    index: 0
  },
  {
    name: "2", 
    lat: 55.9439703960433,
    lon: -3.1893846776947954,
    index: 1
  }
];

let location1, location2;
let differences = [];
let scaleXBand

window.onload = async function() {
	noCanvas()
	await processData();
	// chart_width = document.querySelector("#HeatIndex").innerWidth;
	let chart = createAxis("Heat Index")
	chart = createAxis("differences")
	createMap()  	

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
    scaleXBand = d3.scaleBand([startDate, endDate], [chart_margin.left, chart_width - chart_margin.right]).paddingInner(.3);
  	let xAxis = d3.axisBottom(scaleX)
  	
  	svg.append('g')
        .attr('class', 'x-axis')
        .style("font-family", "monospace")
        .style('font-size', fontSize)
        .attr('transform', `translate(0,${chart_height- 30})`)
        .call( xAxis )

    let chart = svg.append("g");
    let circleRadius = 2;
    
    let yScale;
    if(des == "differences"){
    	let biggestDistFromZero = d3.max([Math.abs(d3.min(differences, (d)=> d["difference"])), Math.abs(d3.max(differences, (d)=> d["difference"]))])
    	yScale = [-biggestDistFromZero, biggestDistFromZero]
    } else {
    	yScale = [d3.min(location2.concat(location1), (d)=>d[des])-.5, d3.max(location2.concat(location1), (d)=>d[des])+.5]; 	
    }
    let scaleY = d3.scaleLinear(yScale, [chart_height-chart_margin.bottom,chart_margin.top])
    let yAxis = d3.axisLeft(scaleY).tickArguments([5]);

    chart.append('g')
      .attr('class', 'y-axis')
      .style("font-family", "monospace")
      .style('font-size', fontSize)
      .attr('transform', `translate(${chart_margin.left},0)`)
      .call( yAxis )

    chart
			.append("text")
			.attr("class", "yaxislabel")
			.style("font-family", "monospace")
			.style('font-size', fontSize)
			.attr("text-anchor", "middle")  
			.attr("x", () => { return -chart_height/2})
				.attr("y", () => { return 15}) 
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
	        .attr("opacity", locColorsOpacity)

	    chart.selectAll("HeatIndex" + "Label")
	      .data(designation)
	      .join("text")
	      .attr("x", d => { return chart_width - chart_margin.right + 15})     
	      .attr("y", d => scaleY(d["max"]) + 13)
	      .style("font-family", "monospace")
	      .style('font-size', fontSize)
	      .attr("fill", (d) => (d3.color(d.color).darker(1)))
	      .text((d) => d.Classification)

	    let labels = chart.selectAll("HeatIndex" + "Locations")
	      .data([location1, location2])
	      .join("g")
	      .attr("transform", (d, i) => `translate(${scaleX(d[d.length-1].date)},${scaleY(d[d.length-1][des]) - (i * 10)})`)

	    chart.selectAll("HeatIndex" + "Locations")
	    	.data([location1, location2])
	    	.join("circle")
	    	.attr("transform", (d, i) => `translate(${scaleX(d[d.length-1].date)},${scaleY(d[d.length-1][des])})`)
	    	.attr("r", 2)
	    	.attr("fill", (d) => locColors(d[0].location))
	    	.attr("stroke", "transparent")

	    labels.append("text")
	      .text((d) => "location " + d[0].location)
	      .attr("transform", (d) => `translate(${10},${5})`)
	      .attr("fill", (d) => d3.color(locColors(d[0].location)).darker(1))

	    const line = d3.line().x((d) => scaleX(d.date)).y((d) => {return scaleY(d[des])});
	    let lines = chart
	                  .append("g").selectAll(".line").data([location1, location2])
	                  .join("path").attr("d", (d) => line(d) ).attr("stroke", (d)=>locColors(d[0].location)).attr("fill", "transparent").attr("stroke-width", .5);

	} else if (des == "differences") {

		chart.selectAll("differencesRects").data(differences).join("rect")
	        .attr("x", d => scaleX(d.date))
	        .attr("y", d => scaleY(Math.max(d.difference, 0)))
	        .attr("height", d => Math.abs(scaleY(d.difference) - scaleY(0)))
	        .attr("width", 5)
	        .attr("fill", d => d.difference > 0 ? "red" : "blue").attr("stroke-width", 0)
	        .attr("opacity", locColorsOpacity)

	    chart.append("line").attr("x1", scaleX(startDate)).attr("y1", scaleY(0)).attr("x2", scaleX(endDate)).attr("y2", scaleY(0)).attr("stroke", "#000").attr("stroke-dasharray", "4 1").attr("stroke-width", "0.5");

	    chart.append("text").text((d) => "location 1 hotter")
	    	.attr("fill", "red")
	      	// .attr("transform", (d) => `translate(${scaleX(startDate) + 30},${scaleY.range()[1]+15})`)
	    	.attr("transform", (d) => `translate(${scaleX(startDate) + 5},${scaleY.range()[1]+15})`)
	    	// .attr("text-anchor", "middle")

	    chart.append("text").text((d) => "location 1 colder")
	    	.attr("fill", "blue")
	      	.attr("transform", (d) => `translate(${scaleX(startDate) + 30},${scaleY.range()[0]-15})`)
	}

    return chart;
}

function createMap(){
	let mapcontainer = document.querySelector("#mapcontainer")
	console.log(mapcontainer)
	mapcontainer.setAttribute("style", `height: ${mapcontainer.offsetHeight}px`)
	const map = L.map(mapcontainer, {boxZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: false, zoomControl: false, dragging: false, scrollWheelZoom: false}).setView([55.943738623653616, -3.188825959330503], 17);

	// L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	// 	minZoom: 0,
	// 	maxZoom: 20,
	// 	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	// 	ext: 'png'
	// }).addTo(map);;

	 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	minZoom: 0,
		maxZoom: 20,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            .style('font-size', fontSize)
            .text((d) => {return "location " + d.name})
            .style('fill', (d) => d3.color(locColors(d)).darker(1))
            .attr("x", () => { return 15})
            .attr("y", () => { return 4})

  const update = () => Dots
              .attr("transform", d => {return "translate(" + map.latLngToLayerPoint([d.lat, d.lon]).x + "," + map.latLngToLayerPoint([d.lat, d.lon]).y +")"}) 

  map.on("zoomend", update)
}

async function processData(){
	location1 = await d3.csv("location1.csv", d3.autoType); 
	location1 = location1.map((d) => {
		d.date = processDate(d["FORMATTED DATE_TIME"])
		d["Heat Index"] = (d["Heat Index"] - 32) / 1.8
		d.location = "1"
		return d
	})
	location1 = d3.filter(location1, (d) => d.date > startDate && d.date < endDate)

	location2 = await d3.csv("location2.csv", d3.autoType); 
	location2 = location2.map((d) => {
		d.date = d.date = processDate(d["FORMATTED DATE_TIME"]);
		d["Heat Index"] = (d["Heat Index"] - 32) / 1.8
		d.location = "2";
		return d;
	})
	location2 = d3.filter(location2, (d) => d.date > startDate && d.date < endDate);

	location1.forEach((d) => {
			let match = location2.find((v) => v.date.getTime() === d.date.getTime())
			if(match){
				differences.push({
					date: d.date,
					difference: d["Heat Index"] - match["Heat Index"]
				})
			}
		})
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
  
}