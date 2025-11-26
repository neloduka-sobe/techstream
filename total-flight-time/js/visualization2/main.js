let calendarMap;

loadDataVis2();

function loadDataVis2() {
  

  //working with yearly data instead of monthly data to fit peer feedback
  const summaryFiles = [

    //four years all available data, one year before, two years technically during, and one year afterwards 
    {file: "2019_monthly_summary.csv", year: 2019},
    {file: "2020_monthly_summary.csv", year: 2020},
    {file: "2021_monthly_summary.csv", year: 2021},
    {file: "2022_monthly_summary.csv", year: 2022}

  ];

  //setting up here of the array to load all data from files
  let promises = summaryFiles.map(fileInfo => {

    return d3.csv(`data/${fileInfo.file}`, row => {

      return {

        month: +row.month,
        monthName: row.month_name,
        year: +row.year,
        total_flights: +row.total_flights,
        unique_aircraft: +row.unique_aircraft,
        avg_daily_flights: +row.avg_daily_flights

      };

    }).then(data => {

      return {

        //double check data is sorted by the integer value for each month (1 - 12)
        year: fileInfo.year,
        data: data.sort((a, b) => a.month - b.month)

      };

    });

  });


  //now handle all the loaded data using the promises array
  Promise.all(promises).then(allYearData => {
    

    // Initialize the Calendar Map with all year data
    calendarMap = new CalendarMap("visualization-2", allYearData);
    calendarMap.loadFlights();

  });
}



