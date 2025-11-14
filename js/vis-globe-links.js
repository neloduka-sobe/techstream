// js/vis-globe-links.js

function renderGlobeLinks(selector, data) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  const node = container.node();
  const width  = node.clientWidth  || 960;
  const height = node.clientHeight || 600;

  // Create an iframe that loads the standalone globe page
  container
    .append("iframe")
    .attr("src", "globe/index.html")         // path from TechStream root
    .attr("title", "Global Connections Globe")
    .style("width", "100%")
    .style("height", "100%")
    .style("border", "none")
    .style("display", "block");
}
