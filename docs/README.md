# TechStream — Air Travel Story

**TechStream** is an interactive data visualization project that explores how the COVID-19 pandemic reshaped global aviation. Through a series of scrolling visualizations ("scrollytelling"), it tells the story of the industry's collapse, the uneven recovery across different regions, and the permanent changes to fleets and routes.

## Project Overview

This project uses **D3.js** to create dynamic, data-driven visualizations that respond to user interaction (scrolling). The narrative covers:
*   **Emissions**: Comparing aviation emissions by country to see who recovered fastest.
*   **Flight Activity**: Analyzing the drop in global flight volume.
*   **Aircraft**: How airlines adapted by retiring older aircraft (e.g., A380, B747) and favoring efficient ones.
*   **Global Routes**: An interactive globe showing how international connections shifted.

## Directory Structure

This repository is organized as follows:

*   **`index.html`**: The main entry point for the web application. Contains the HTML structure and narrative text.
*   **`js/`**: Contains the custom JavaScript code for the visualizations and application logic.
    *   `main.js`: Core application logic, scroll handling, and data loading.
    *   `vis-*.js`: Specific D3.js visualization modules (e.g., `vis-globe-links.js`, `vis-calendar.js`).
*   **`assets/`**: Static assets.
    *   `style.css`: Main stylesheet for layout and visual design.
*   **`data/`**: (Implied) Contains the CSV and JSON data files used by the visualizations.
*   **`docs/`**: Documentation files, including this README.
*   **`fuel-gauge/`, `globe/`, `total-flight-time/`**: Development directories containing isolated experiments or data processing scripts for specific visualizations.

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

Simply use the diployed link: https://neloduka-sobe.github.io/techstream/

## Credits & Data Sources

*   **Flight Data**: [OpenSky Network](https://opensky-network.org/)
*   **Economic Data**: [OECD](https://www.oecd.org/)
