/* Calendar Visualization js file for component class */

class CalendarMap {

    constructor(parentElement, yearlyData) {


        this.parentElement = parentElement;
        this.yearlyData = yearlyData;
        this.calendarPadding = 50;

        this.highlightedYears = new Set(); 



        this.resizeTimeout = null;
        
        
        this.yearColors = {
            2019: "#cb4acbff", 
            2020: "#55bac5ff",   
            2021: "#33c148ff", 
            2022: "#cb9340ff" 
        };
        
        window.addEventListener('resize', () => {

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(() => {

                this.handleResize();

            }, 250); 

        });

        //got rid of load flights and replaced it witht his since data is preloaded and acquired from the given csv files
        this.initVis();


    }

    handleResize() {

        d3.select("#" + this.parentElement).select("svg").remove();

        this.initVis();

    }


    initVis() {

        let vis = this;

        vis.margin = {top: 60, right: 120, bottom: 80, left: 80};

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

        //only handling we have to do for the flight data here -------
        let allFlights = [];

        vis.yearlyData.forEach(yearData => {

            yearData.data.forEach(monthData => {

                allFlights.push(monthData.total_flights);

            });

        });
       // ----------------------------------------------------------------


        //x scale for the months
        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            //added some spade here on the left and right of the graph specifically to avoid overlapping wiht the y axis and the legend.
            .domain([0.5, 12.5]);

        //y scale for the flight totals
        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(allFlights) * 1.1]);

        //setting of dates on x axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d => {

                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; 

                return monthNames[Math.round(d)];

            })
            .ticks(12)
            .tickValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(".2s"));

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);



        //labeeling the axes
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.calendarPadding)
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Month");

        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -vis.calendarPadding)
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Total Flights (in millions)");

        // COMMENTED THIS OUT FOR NOW SINCE IT LOOKS BAD
        //title for the graph NOT THE SLIDE
        // vis.svg.append("text")
        //     .attr("class", "chart-title")
        //     .attr("text-anchor", "middle")
        //     .attr("x", vis.width / 2)
        //     .attr("y", -20)
        //     .style("font-size", "18px")
        //     .style("font-weight", "bold")
        //     .text("Monthly Flight Totals by Year");

        //initalizing the tooltip part
        var tooltip = d3.select("body").append("div")
            .attr("class", "calendar-tooltip")
            .style("position", "absolute")
            .style("padding", "10px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#ffffffff")
            .style("border-radius", "8px")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("opacity", 0);
        

        //handling for monthly points and conneciton lines
        vis.yearlyData.forEach(yearData => {
            
            //lines connecting each point
            vis.svg.append("path")
                .datum(yearData.data)
                .attr("class", `data-line-${yearData.year}`)
                .attr("fill", "none")
                .attr("stroke", vis.yearColors[yearData.year])
                .attr("stroke-width", 3)
                .attr("opacity", 1)
                .attr("d", function(d) {

                    var line = d3.line()
                        .x(d => vis.x(d.month))
                        .y(d => vis.y(d.total_flights))
                        .curve(d3.curveMonotoneX);

                    return line(d);

                });

            //points for each month
            vis.svg.selectAll(`.month-point-${yearData.year}`)
                .data(yearData.data)
                .enter()
                .append("circle")
                .attr("class", `month-point-${yearData.year}`)
                .attr("cx", d => vis.x(d.month))
                .attr("cy", d => vis.y(d.total_flights))
                .attr("r", 6)
                .attr("fill", vis.yearColors[yearData.year])
                .attr("stroke", "rgba(255, 255, 255, 1)")
                .attr("stroke-width", 2)
                .style("cursor", "pointer")

                //my hover events
                .on("mouseover", function(event, d) {

                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 10);


                    tooltip.style("opacity", 1)
                        .html(`<strong>Year:</strong> ${d.year}<br/>
                               <strong>Month:</strong> ${d.monthName}<br/>
                               <strong>Total Flights:</strong> ${d.total_flights.toLocaleString()}<br/>
                               <strong>Unique Aircrafts:</strong> ${d.unique_aircraft.toLocaleString()}<br/>
                               <strong>Avg Daily Flights:</strong> ${Math.round(d.avg_daily_flights).toLocaleString()}`)
                        .style("left", (event.pageX + 20) + "px")
                        .style("top", (event.pageY - 20) + "px");

                })

                //handling after the hover events
                .on("mouseout", function() {

                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 6);
                    
                    tooltip.style("opacity", 0);

                });


        });

        //legend handling
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + 20}, 50)`);

        const legendItems = legend.selectAll(".legend-item")
            .data(vis.yearlyData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", function(d, i) { 
                return `translate(0, ${i * 25})`; 
            })
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                
                vis.toggleYearHighlight(d.year);

            });

        legendItems.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => vis.yearColors[d.year]);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(d => d.year);

    }

    toggleYearHighlight(selectedYear) {

        let vis = this;
        
        /* only the first case of clicking a year removes all the other years 
        * this is to allow for comparisons of specific years, like 2019 vs 2020 if viewer wants this
        * should the viewer want to reset everything, they can reclick the only highlighted year
        * or they can click them all manually
        */
        if (vis.highlightedYears.size === 0) {
           

            vis.highlightedYears.add(selectedYear);


            
            vis.yearlyData.forEach(yearData => {

                const opacity = yearData.year === selectedYear ? 1 : 0.2;
                
                //handling the opacity changes for both the lines and months
                vis.svg.selectAll(`.data-line-${yearData.year}`)
                    .transition()
                    .duration(300)
                    .attr("opacity", opacity);
                    
                vis.svg.selectAll(`.month-point-${yearData.year}`)
                    .transition()
                    .duration(300)
                    .attr("opacity", opacity);

            });
            
        } 

        /* If we are clicking on an already highlighted year we either 
        * A) Special case where we are back to four highlighted, then original behavior should proceed
        * B) There is only one year highlighted, then we reset to original state
        * C) If there is more than one year after removing the selected year, just dim that selected year
        * 
        */
        else if (vis.highlightedYears.has(selectedYear)) {

            
            vis.highlightedYears.delete(selectedYear);
            
            //this case handles the returning behavior of if all four years are highlighted again
            if (vis.highlightedYears.size === 3){
                
                vis.highlightedYears.clear();

                
                vis.highlightedYears.add(selectedYear);


                vis.yearlyData.forEach(yearData => {

                    const opacity = yearData.year === selectedYear ? 1 : 0.2;
                    
                    //handling the opacity changes for both the lines and months
                    vis.svg.selectAll(`.data-line-${yearData.year}`)
                        .transition()
                        .duration(300)
                        .attr("opacity", opacity);
                        
                    vis.svg.selectAll(`.month-point-${yearData.year}`)
                        .transition()
                        .duration(300)
                        .attr("opacity", opacity);

                });

            }
            else if (vis.highlightedYears.size === 0) {
                
                //handling the opacity changes for both the lines and months
                vis.yearlyData.forEach(yearData => {

                    vis.svg.selectAll(`.data-line-${yearData.year}`)
                        .transition()
                        .duration(300)
                        .attr("opacity", 1);
                        
                    vis.svg.selectAll(`.month-point-${yearData.year}`)
                        .transition()
                        .duration(300)
                        .attr("opacity", 1);

                });

            } else {
                
                //handling the opacity changes for both the lines and months, only for clicked one
                vis.svg.selectAll(`.data-line-${selectedYear}`)
                    .transition()
                    .duration(300)
                    .attr("opacity", 0.2);
                    
                vis.svg.selectAll(`.month-point-${selectedYear}`)
                    .transition()
                    .duration(300)
                    .attr("opacity", 0.2);
            }
            
        } 

        /* Final case is that we are clicking on a year that is not highlighted
        * thus add it to highlight
        */       
        
        else {
        
            vis.highlightedYears.add(selectedYear);
            

            //handling the opacity changes for both the lines and months, only for clicked one
            vis.svg.selectAll(`.data-line-${selectedYear}`)
                .transition()
                .duration(300)
                .attr("opacity", 1);
                
            vis.svg.selectAll(`.month-point-${selectedYear}`)
                .transition()
                .duration(300)
                .attr("opacity", 1);

        }

    }


}
