/* Calendar Visualization js file for component class */

class CalendarMap {


    constructor(parentElement, data) {

        this.parentElement = parentElement;
        this.data = data;
        this.flightsPerDay = {};
        this.calendarPadding = 30;

    }


    loadFlights() {

        console.log("loadFlights");
        var vis = this;
        console.log(vis.data);

        //group flights by day
        vis.data.data.forEach(flight => {
            

            var day = flight.day.toISOString().split("T")[0];

            
            if (!vis.flightsPerDay[day]) {
                vis.flightsPerDay[day] = [];
            }

            vis.flightsPerDay[day].push(flight.total_flights);

        });

        console.log("Flights per day:", vis.flightsPerDay);
        
        vis.initVis();
    }


    initVis(){

        let vis = this;

		vis.margin = {top: 40, right: 40, bottom: 60, left: 40};

		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		//svg drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        //overlay with path clipping
		vis.svg.append("defs").append("clipPath")
			.attr("id", "clip")

			.append("rect")
			.attr("width", vis.width)
			.attr("height", vis.height);
        
        
        //console.log("vis.data.data:", vis.data.data);



        //scales and axes stuff
        vis.x = d3.scaleTime()
            .range([vis.calendarPadding, vis.width - vis.calendarPadding])
            .domain([d3.min(vis.data.data, d => d.day), d3.max(vis.data.data, d => d.day)]);

        vis.y = d3.scaleLinear()
            .range([vis.height - vis.calendarPadding, vis.calendarPadding])
            .domain([0, d3.max(vis.data.data, d => d.total_flights)]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.timeFormat("%b %d"));    

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height - vis.calendarPadding) + ")")
            .call(vis.xAxis);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(" + (vis.calendarPadding) + ",0)")
            .call(vis.yAxis);
   
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.calendarPadding)
            .style("font-size", "14px")
            .style("fill", "#ffffff")
            .style("font-weight", "bold")
            .text("Date (Month and Day)");
     
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", 0 + vis.calendarPadding)
            .attr("y", 0)
            .style("font-size", "14px")
            .style("fill", "#ffffff")
            .style("font-weight", "bold")
            .text("Total Flights");




        //initalizing the tooltip part
        var tooltip = d3.select("body").append("div")
            .attr("class", "calendar-tooltip")
            .style("position", "absolute")
            .style("padding", "10px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "8px")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("opacity", 0);


        //path between each point handled here
        vis.svg.append("path")
            .datum(vis.data.data)
            .attr("class", "data-line")
            .attr("fill", "none")
            .attr("stroke", "#307c32ff")
            .attr("stroke-width", 2)
            .attr("opacity", 1)
            .attr("d", function(d) {
                
                var line = d3.line()
                    .x(d => vis.x(d.day))
                    .y(d => vis.y(d.total_flights))
                    .curve(d3.curveLinear);

                return line(d);

            });


        //Adding of data points for each day
        vis.svg.selectAll(".day-data")
            .data(vis.data.data)
            .enter()
            .append("circle")
            .attr("class", "day-data")
            .attr("cx", d => vis.x(d.day))
            .attr("cy", d => vis.y(d.total_flights))
            .attr("r", 8)
            .attr("fill", "#38e03eff")
            .attr("stroke", "#000000ff")
            .attr("stroke-width", 2)

            //my hover events
            .on("mouseover", function(event, d) {
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 20)
                    .attr("fill", "#37a2ffff");

                
                tooltip.style("opacity", 1)
                    .html(`<strong>Date:</strong> ${d.day.toDateString()}<br/>
                    <strong>Flights:</strong> ${d.total_flights}`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px");
                
            })

            //handling after the hover events
            .on("mouseout", function() {
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .attr("fill", "#38e03eff");
                
               
                tooltip.style("opacity", 0);


            });




    }


}
