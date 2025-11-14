// js/vis-calendar.js

function renderCalendar(selector, mainData) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  const node = container.node();
  const width  = node.clientWidth  || 960;
  const height = node.clientHeight || 600;

  container
    .append("iframe")
    .attr("src", "total-flight-time/index.html")  // relative path from root
    .attr("title", "Total Flight Time Calendar")
    .style("width", "100%")
    .style("height", "100%")
    .style("border", "none")
    .style("display", "block");
}
