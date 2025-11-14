let calendarMap;

let monthlyDataVis2 = [];

//start application by loading the data
loadDataVis2();



function loadDataVis2() {
  //load each months data
  var promise1 = d3.csv("data/2019_01_dailytotals.csv", row => {

    //fixing utc to est time zone bug
    var dateParts = row.day.split('-');
    row.day = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    row.total_flights = +row.unique_icao24_count;

    return row = {

      day: row.day,
      total_flights: row.total_flights
      
    };

  });

  //load each months data
  var promise2 = d3.csv("data/2020_04_dailytotals.csv", row => {

    //fixing utc to est time zone bug
    var dateParts = row.day.split('-');
    row.day = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    row.total_flights = +row.unique_icao24_count;

    return row = {

      day: row.day,
      total_flights: row.total_flights
      
    };

  });

  //load each months data
  var promise3 = d3.csv("data/2022_12_dailytotals.csv", row => {

    //fixing utc to est time zone bug
    var dateParts = row.day.split('-');
    row.day = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    row.total_flights = +row.unique_icao24_count;

    return row = {

      day: row.day,
      total_flights: row.total_flights
      
    };

  });

  Promise.all([promise1, promise2, promise3]).then((data1) => {

    monthlyDataVis2.push({ month: "2019_01", data: data1[0], label: "January 2019" });
    monthlyDataVis2.push({ month: "2020_04", data: data1[1], label: "April 2020" });
    monthlyDataVis2.push({ month: "2022_12", data: data1[2], label: "December 2022" });
    console.log("All monthly data loaded for Vis2:", monthlyDataVis2);

    createMonthSelectorVis2();

    //Initialize the Calendar Map with January 2019 data
    calendarMap = new CalendarMap("visualization-2", monthlyDataVis2[0]);
    calendarMap.loadFlights();

  });

}


function createMonthSelectorVis2() {

       
    var buttonContainer = d3.select("#visualization-2").append("div")
        .attr("class", "month-selector")
        .style("text-align", "center");
    
    var buttons = buttonContainer.selectAll(".month-button")
        .data(monthlyDataVis2)
        .enter()
        .append("button")
        .attr("class", "month-button")
        .style("margin", "5px")
        .style("padding", "10px")
        .style("border", "2px solid #000000ff")
        .style("border-radius", "10px")
        .style("background", "#1f1f1fff")
        .style("color", "#ffffffff")
        .style("font-size", "14px")
        .text(d => d.label)

        //handiling of clicking button
        .on("click", function(event, d) {

          d3.select("#visualization-2").select("svg").remove();
          buttons.style("background", "#1f1f1fff"); 
          d3.select(this).style("background", "#307c32ff");
          

          calendarMap = new CalendarMap("visualization-2", d);
          calendarMap.loadFlights();

        });     
      
}



