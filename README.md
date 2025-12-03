# TechStream — Air Travel Story

**TechStream** is an interactive data visualization project that explores how the COVID-19 pandemic reshaped global aviation. Through a series of side-scrollling panels with storytelling and visualizations, it visually communicates the impact on the industry through analysis of the before, during and after effects of the COVID-19 pandemic. Visualizing the uneven recovery across different regions, permanent changes to fleets and routes, and the idea of what global aviation looks like for different countries through many metrics.

## Video and Process Book links

* **[Process book](https://docs.google.com/document/d/1LfCu1Di3CxLBlXKwkXHrE_RhM_urP86IgMJZO8o6zVU/edit?usp=sharing)**
     * Process book also included as physical copy in `docs/` sub directory.
* **[Video Link](https://youtu.be/uBenjUY4YJI)**
     * Video link to youtube video for 2 minute walkthrough

## Project Overview

This project uses **D3.js** to create dynamic, data-driven visualizations that respond to user interaction. The narrative covers:
*   **Emissions**: Comparing aviation emissions by country to see who recovered fastest, and what the largest global aviation regions are.
*   **Flight Activity**: Analyzing the drop in global flight volume, tracing the imapcts and dates behind them. And allowing for meaningful comparison.
*   **Aircraft**: How airlines adapted by retiring older aircraft (e.g., A380, B747) and favoring efficient ones. Understanding flight travel not just as dots on a map but the aircrafts behind them.
*   **Global Routes**: An interactive globe showing how international connections shifted. The different recoveries of many regions and which ones stood out.

## Directory Structure

This repository is organized as follows:

*   **`index.html`**: The main entry point for the web application. Contains the HTML structure and narrative text.
*   **`js/`**: Contains the custom JavaScript code for the visualizations and application logic.
    *   `main.js`: Core application logic, scroll handling, and data loading.
    *   `vis-*.js`: Specific D3.js visualization modules (e.g., `vis-globe-links.js`, `vis-calendar.js`)
    *   In the case for `vis-podium-aircraft.js` the code for the visualization element itself is contained inside of it as well as all functionality.
*   **`assets/`**: Static assets.
    *   `style.css`: Main stylesheet for layout and visual design.
*   **`fuel-gauge/`, `globe/`, `total-flight-time/`**: Development directories containing isolated experiments or data processing scripts for specific visualizations.
    *   `fuel-gauge/`: Structure contains `fuel-gauge.js` for all the functional js code, `index.html` for the page elements, and `styles.css` for page specific styles
    *   `globe/`: contains the data in various csv files, as well as scripts in python to extract the data from the csv files in python `extract_faa_codes.py` and `filter_aircraft_csv.py`, the main functional code for the visualization inside `index.html`, as well as other supporting files for data with `world-110.json`, `world-country-names.tsv` and `world.json`.
    *   `total-flight-time/`: contains the css file in the `/css` subdirectory, the data used in `/data` subdirectory, and the code for the visualization inside `/js/visualization2` sub folder with `calednar.js` being the main functionality behind the visualization, and `main.js` being the file responsible for loading the data and visualization itself.

## Data
The data contained in this project is separated into the specific visualizations that use subsets or filtered and cleaned versions.
* **`fuel-gauge/`**: Uses hard coded data based on statistics and thus does not have dedicated data files.
* **`globe/`**: Uses various csv files including: `aircraft.csv`; `airports.csv`; `faa.csv`; three filtered data documents for april, december and jauary second in `flights-[MONTH]-[DAY]-[YEAR]-filtered.csv`; listings of 100 thousand flights in `flights100k-[MONTH].csv`.
* **`total-flight-time`**: Data found in subdirectory of `/data`, using yearly data of cleaned rows filtered by number of flights from original data sourced for each month of a year and later comliled into one monthly summary for that specific year in `[year]_monthly_summary.csv`.

## Libraries & Dependencies

This project relies on the following external libraries:

*   **[D3.js v7](https://d3js.org/)**: Used for all data manipulations and SVG/Canvas rendering.
    *   Loaded via CDN in `index.html`.

## Usage

To run this project locally:

1.  **Clone the repository**.
2.  **Start a local web server**. Because the project loads external data files (CSV/JSON), it cannot be run by simply opening `index.html` in a browser due to CORS security restrictions.
    *   **Python**: `python -m http.server`
    *   **Node.js**: `npx http-server`
    *   **VS Code**: Use the "Live Server" extension.
3.  **Open the URL** (usually `http://localhost:8000` or `http://127.0.0.1:5500`) in your web browser.


OR

Simply use the deployed link: https://neloduka-sobe.github.io/techstream/

## Credits & Data Sources

*   **Flight Data**: [OpenSky Network](https://opensky-network.org/)
*   **Economic Data**: [OECD](https://www.oecd.org/)
