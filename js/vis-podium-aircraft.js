// js/vis-podium-aircraft.js
// Y-axis removed - no numbers on y-axis

async function renderPodium(selector, data) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  // Use fixed viewBox dimensions for proper scaling
  const viewBoxWidth = 1200;
  const viewBoxHeight = 700;

  // Show animated loading message
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .style("overflow", "hidden"); // Prevent overlap with other slides
  
  const loadingText = svg.append("text")
    .attr("x", viewBoxWidth / 2)
    .attr("y", viewBoxHeight / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#1e3a5f")
    .attr("font-size", "18")
    .text("Loading aircraft data...");

  // Animate loading dots
  let dots = 0;
  const loadingInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    loadingText.text("Loading aircraft data" + ".".repeat(dots));
  }, 500);

  try {
    // Load aircraft lookup data
    const aircraftData = await d3.csv("globe/aircraft.csv");
    const aircraftLookup = new Map();
    aircraftData.forEach(d => {
      if (d.icao24 && d.model) {
        aircraftLookup.set(d.icao24.toUpperCase(), {
          model: d.model,
          manufacturer: d.manufacturername || "Unknown",
          typecode: d.typecode || ""
        });
      }
    });

    // Load flight data for three periods
    const dateInfo = {
      'jan': { 
        file: 'globe/flights100k-jan1.csv', 
        label: 'Jan 2019', 
        color: '#4a90e2',
        gradient: ['#4a90e2', '#6ba3e8'],
        subtitle: 'Pre-Pandemic'
      },
      'apr': { 
        file: 'globe/flights100k-apr1.csv', 
        label: 'Apr 2020', 
        color: '#e24a4a',
        gradient: ['#e24a4a', '#e86a6a'],
        subtitle: 'Peak Pandemic'
      },
      'dec': { 
        file: 'globe/flights100k-dec1.csv', 
        label: 'Dec 2022', 
        color: '#4ae24a',
        gradient: ['#4ae24a', '#6ae86a'],
        subtitle: 'Post-Pandemic'
      }
    };

    const allFlights = {};
    
    // Load all datasets
    for (const [key, info] of Object.entries(dateInfo)) {
      try {
        const flights = await d3.csv(info.file);
        allFlights[key] = flights;
      } catch (err) {
        console.warn(`Failed to load ${info.file}:`, err);
        allFlights[key] = [];
      }
    }

    // Count aircraft models per period
    const modelCounts = {};
    
    for (const [period, flights] of Object.entries(allFlights)) {
      const counts = {};
      flights.forEach(f => {
        const icao24 = (f.icao24 || "").toUpperCase();
        const aircraft = aircraftLookup.get(icao24);
        if (aircraft && aircraft.model) {
          const model = aircraft.model.trim();
          if (model) {
            counts[model] = (counts[model] || 0) + 1;
          }
        }
      });
      modelCounts[period] = counts;
    }

    // Get top models across all periods
    const allModels = new Set();
    Object.values(modelCounts).forEach(counts => {
      Object.keys(counts).forEach(model => allModels.add(model));
    });

    // Calculate total counts and get top 10 models
    const modelTotals = {};
    allModels.forEach(model => {
      modelTotals[model] = Object.values(modelCounts)
        .reduce((sum, counts) => sum + (counts[model] || 0), 0);
    });

    const topModels = Array.from(allModels)
      .sort((a, b) => modelTotals[b] - modelTotals[a])
      .slice(0, 10);

    // Prepare data for grouped bar chart
    const chartData = topModels.map(model => ({
      model: model,
      jan: modelCounts.jan?.[model] || 0,
      apr: modelCounts.apr?.[model] || 0,
      dec: modelCounts.dec?.[model] || 0,
      total: modelTotals[model],
      // Calculate trends
      trend: {
        preToPeak: modelCounts.jan?.[model] || 0 > 0 
          ? ((modelCounts.apr?.[model] || 0) - (modelCounts.jan?.[model] || 0)) / (modelCounts.jan?.[model] || 1) * 100
          : 0,
        peakToPost: modelCounts.apr?.[model] || 0 > 0
          ? ((modelCounts.dec?.[model] || 0) - (modelCounts.apr?.[model] || 0)) / (modelCounts.apr?.[model] || 1) * 100
          : 0
      }
    }));

    clearInterval(loadingInterval);
    svg.selectAll("*").remove();
    drawGroupedBarChart(svg, chartData, dateInfo, viewBoxWidth, viewBoxHeight, allFlights);

  } catch (err) {
    clearInterval(loadingInterval);
    console.error("Error rendering podium:", err);
    svg.selectAll("*").remove();
    svg.append("text")
      .attr("x", viewBoxWidth / 2)
      .attr("y", viewBoxHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#e24a4a")
      .attr("font-size", "16")
      .text("Error loading data. See console.");
  }
}

function drawGroupedBarChart(svg, data, dateInfo, width, height, allFlights) {
  // Professional margins - increased margins to prevent overlap and accommodate y-axis labels
  const margin = { top: 180, right: 160, bottom: 90, left: 130 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create gradient definitions
  const defs = svg.append("defs");
  const periods = ['jan', 'apr', 'dec'];
  
  periods.forEach(period => {
    const gradient = defs.append("linearGradient")
      .attr("id", `gradient-${period}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", dateInfo[period].gradient[0])
      .attr("stop-opacity", 1);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", dateInfo[period].gradient[1])
      .attr("stop-opacity", 0.9);
  });

  // Calculate totals early for use in subtitle
  const totalJan = data.reduce((sum, d) => sum + (d.jan || 0), 0);
  const totalApr = data.reduce((sum, d) => sum + (d.apr || 0), 0);
  const totalDec = data.reduce((sum, d) => sum + (d.dec || 0), 0);
  const decline = totalJan > 0 ? ((totalApr - totalJan) / totalJan * 100).toFixed(1) : "0.0";
  const recovery = totalApr > 0 ? ((totalDec - totalApr) / totalApr * 100).toFixed(1) : "0.0";

  // Title with subtitle - responsive font sizes
  // Positioned lower to avoid overlap with previous slide
  const titleSize = Math.min(28, width / 45);
  const subtitleSize = Math.min(18, width / 65);
  
  svg.append("text")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("font-size", titleSize)
    .attr("font-weight", "600")
    .attr("fill", "#0f172a")
    .text("Top Aircraft Models Across Time Periods");

  svg.append("text")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", 68)
    .attr("text-anchor", "middle")
    .attr("font-size", subtitleSize)
    .attr("fill", "#64748b")
    .text("How the pandemic reshaped the global aircraft fleet");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x0 = d3.scaleBand()
    .domain(data.map(d => d.model))
    .range([0, chartWidth])
    .paddingInner(0.2)
    .paddingOuter(0.05);

  const x1 = d3.scaleBand()
    .domain(periods)
    .range([0, x0.bandwidth()])
    .padding(0.15);

  // Collect all data values to calculate percentiles
  const allValues = [];
  data.forEach(d => {
    if (d.jan > 0) allValues.push(d.jan);
    if (d.apr > 0) allValues.push(d.apr);
    if (d.dec > 0) allValues.push(d.dec);
  });
  allValues.sort((a, b) => a - b);
  
  const maxValue = d3.max(data, d => Math.max(d.jan, d.apr, d.dec));
  const q25 = d3.quantile(allValues, 0.25) || 0;
  const q75 = d3.quantile(allValues, 0.75) || 0;
  
  // Calculate domain with sufficient padding for value labels at the top
  // Use enough padding (40%) so labels on top of bars have room
  const yDomainMax = maxValue === 0 ? 1 : maxValue * 1.4;
  
  // Create scale first without nice() to set custom ticks
  const y = d3.scaleLinear()
    .domain([0, yDomainMax])
    .range([chartHeight, 0]);

  // Grid lines removed

  const xAxis = g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x0));
  
  xAxis.selectAll("text")
    .attr("transform", "rotate(-35)")
    .attr("text-anchor", "end")
    .attr("dx", "-0.2em")
    .attr("dy", "0.4em")
    .attr("font-size", "9")
    .attr("fill", "#475569")
    .attr("font-weight", "500");

  xAxis.selectAll("line, path")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 1);

  // X-axis label
  g.append("text")
    .attr("fill", "#0f172a")
    .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 20})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "12")
    .attr("font-weight", "600")
    .text("Aircraft Model");

  // Y-axis with custom ticks: max value, 75th percentile, 25th percentile
  // Format numbers with commas for thousands
  const yAxisFormat = d3.format(",d");
  
  // Create custom tick values - round to nearest hundred
  const roundToHundred = (value) => Math.round(value / 100) * 100;
  
  const customTicks = [0];
  const roundedQ25 = roundToHundred(q25);
  const roundedQ75 = roundToHundred(q75);
  const roundedMax = roundToHundred(maxValue);
  
  if (roundedQ25 > 0 && roundedQ25 <= yDomainMax) customTicks.push(roundedQ25);
  if (roundedQ75 > 0 && roundedQ75 <= yDomainMax) customTicks.push(roundedQ75);
  if (roundedMax > 0 && roundedMax <= yDomainMax) customTicks.push(roundedMax);
  
  // Remove duplicates and sort
  const uniqueTicks = [...new Set(customTicks)].sort((a, b) => a - b);
  
  // Debug: log tick values
  console.log("Y-axis ticks:", uniqueTicks, "Max:", roundedMax, "Q25:", roundedQ25, "Q75:", roundedQ75);
  
  // Create y-axis with custom ticks (lines only, we'll add text manually)
  const yAxis = g.append("g")
    .call(d3.axisLeft(y)
      .tickValues(uniqueTicks)
      .tickFormat("") // Don't show default text
      .tickSize(-chartWidth)); // Extend ticks across chart width
  
  // Add small tick indicators on the y-axis line itself
  const yAxisTicks = g.append("g")
    .attr("class", "y-axis-tick-indicators");
  
  uniqueTicks.forEach(tickValue => {
    const yPos = y(tickValue);
    // Add small tick mark on the y-axis line
    yAxisTicks.append("line")
      .attr("x1", -5)
      .attr("x2", 0)
      .attr("y1", yPos)
      .attr("y2", yPos)
      .attr("stroke", "#475569")
      .attr("stroke-width", 2);
  });
  
  // Manually create y-axis text labels to ensure they're visible
  const yAxisLabels = g.append("g")
    .attr("class", "y-axis-labels");
  
  uniqueTicks.forEach(tickValue => {
    const yPos = y(tickValue);
    yAxisLabels.append("text")
      .attr("x", -15)
      .attr("y", yPos)
      .attr("text-anchor", "end")
      .attr("font-size", "12")
      .attr("fill", "#1e293b")
      .attr("font-weight", "600")
      .attr("dy", "0.35em") // Center vertically on tick
      .style("opacity", 1)
      .text(yAxisFormat(tickValue));
  });
  
  console.log("Created", uniqueTicks.length, "y-axis labels at positions:", uniqueTicks.map(t => y(t)));
  
  // Style the y-axis lines (tick marks)
  yAxis.selectAll("line")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 1)
    .attr("x2", 0); // Only show tick marks, not full width lines
  
  // Style the y-axis path (main axis line)
  yAxis.select("path")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 1)
    .attr("d", `M 0 ${chartHeight} V 0`);
  
  // Y-axis label - positioned to not extend above chart
  g.append("text")
    .attr("fill", "#0f172a")
    .attr("transform", "rotate(-90)")
    .attr("x", -(chartHeight / 2))
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .attr("font-size", "12")
    .attr("font-weight", "600")
    .text("Number of Flights");

  let highlightedPeriod = null;
  const hoveredBars = new Set();
  const allLabelData = []; // Store all label data for collision detection

  periods.forEach((period, periodIdx) => {
    const bars = g.selectAll(`rect.${period}`)
      .data(data)
      .enter()
      .append("rect")
      .attr("class", `bar ${period}`)
      .attr("x", d => x0(d.model) + x1(period))
      .attr("y", chartHeight)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", `url(#gradient-${period})`)
      .attr("rx", 3)
      .attr("opacity", d => highlightedPeriod === null || highlightedPeriod === period ? 0.85 : 0.25)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))")
      .on("mouseover", function(event, d) {
        const barId = `${d.model}-${period}`;
        hoveredBars.add(barId);
        
        if (highlightedPeriod === null) {
          d3.select(this)
            .interrupt()
            .attr("opacity", 1)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))");
        }
        showTooltip(event, d, period, dateInfo[period]);
      })
      .on("mouseout", function(event, d) {
        const barId = `${d.model}-${period}`;
        hoveredBars.delete(barId);
        
        if (highlightedPeriod === null) {
          d3.select(this)
            .interrupt()
            .attr("opacity", 0.85)
            .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))");
        }
        hideTooltip();
      })
      .on("click", function(event, d) {
        if (highlightedPeriod === period) {
          highlightedPeriod = null;
          hoveredBars.forEach(barId => {
            const [model, barPeriod] = barId.split('-');
            const barElement = g.selectAll(`rect.${barPeriod}`).filter(function(d) { return d.model === model; });
            barElement
              .interrupt()
              .attr("opacity", highlightedPeriod === null || highlightedPeriod === barPeriod ? 0.85 : 0.25)
              .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))");
          });
          hoveredBars.clear();
        } else {
          highlightedPeriod = period;
        }
        updateHighlighting();
      });

    bars.transition()
      .delay((d, i) => i * 20 + periodIdx * 30)
      .duration(500)
      .ease(d3.easeQuadOut)
      .attr("y", d => y(d[period]))
      .attr("height", d => chartHeight - y(d[period]));

    const labels = g.selectAll(`text.${period}-label`)
      .data(data)
      .enter()
      .append("text")
      .attr("class", `${period}-label`)
      .attr("x", d => x0(d.model) + x1(period) + x1.bandwidth() / 2)
      .attr("y", chartHeight)
      .attr("text-anchor", "middle")
      .attr("font-size", "10")
      .attr("font-weight", "600")
      .attr("fill", "#0f172a")
      .attr("opacity", 0)
      .text(d => {
        const value = d[period];
        return value > 0 ? value.toLocaleString() : "";
      });

    // Calculate initial positions and store label data
    labels.each(function(d) {
      const value = d[period];
      if (value === 0) return;
      
      const barTopY = y(value);
      const barHeight = chartHeight - barTopY;
      const labelOffset = 12;
      const minY = 15;
      const calculatedY = barHeight > 25 ? barTopY - labelOffset : barTopY + barHeight / 2;
      const finalY = Math.max(calculatedY, minY);
      
      allLabelData.push({
        element: d3.select(this),
        x: x0(d.model) + x1(period) + x1.bandwidth() / 2,
        y: finalY,
        barTopY: barTopY,
        barHeight: barHeight,
        value: value,
        model: d.model,
        period: period,
        barWidth: x1.bandwidth()
      });
    });
    
    labels.transition()
      .delay((d, i) => i * 20 + periodIdx * 30 + 400)
      .duration(300)
      .ease(d3.easeQuadOut)
      .attr("y", d => {
        const value = d[period];
        if (value === 0) return chartHeight;
        const barTopY = y(value);
        const barHeight = chartHeight - barTopY;
        const labelOffset = 12;
        const minY = 15;
        const calculatedY = barHeight > 25 ? barTopY - labelOffset : barTopY + barHeight / 2;
        return Math.max(calculatedY, minY);
      })
      .attr("opacity", d => {
        const value = d[period];
        return value > 0 ? 1 : 0;
      });
  });
  
  // Collision detection and adjustment after all labels are positioned
  // Wait for transitions to complete, then adjust overlapping labels
  setTimeout(() => {
    adjustLabelOverlaps(allLabelData, chartHeight);
  }, 1000);

  // Add aircraft model names under each bar group
  g.selectAll("text.model-name")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "model-name")
    .attr("x", d => x0(d.model) + x0.bandwidth() / 2)
    .attr("y", chartHeight + 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "9")
    .attr("font-weight", "500")
    .attr("fill", "#475569")
    .text(d => d.model);

  function updateHighlighting() {
    periods.forEach(period => {
      g.selectAll(`rect.${period}`)
        .each(function(d) {
          const barId = `${d.model}-${period}`;
          if (hoveredBars.has(barId)) {
            return;
          }
          d3.select(this)
            .transition()
            .duration(300)
            .ease(d3.easeQuadOut)
            .attr("opacity", highlightedPeriod === null || highlightedPeriod === period ? 0.85 : 0.2);
        });
    });
  }

  // Statistics panel - positioned to not overlap, responsive sizing
  const panelWidth = Math.min(150, width * 0.15);
  const panelX = width - margin.right - panelWidth - 10;
  const statsPanel = svg.append("g")
    .attr("transform", `translate(${panelX}, ${margin.top + 8})`);

  // Totals already calculated above for use in subtitle  
  // Fleet Statistics box now only shows 3 items (Pre-Pandemic, Peak Pandemic, Post-Pandemic)
  const panelHeight = 110; // Reduced height for 3 stats only
  statsPanel.append("rect")
    .attr("width", panelWidth)
    .attr("height", panelHeight)
    .attr("fill", "rgba(255, 255, 255, 0.98)")
    .attr("stroke", "#e2e8f0")
    .attr("stroke-width", 1.5)
    .attr("rx", 6)
    .style("filter", "drop-shadow(0 2px 8px rgba(0,0,0,0.08))");

  const titleFontSize = Math.min(12, panelWidth / 12);
  statsPanel.append("text")
    .attr("x", panelWidth / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", titleFontSize)
    .attr("font-weight", "600")
    .attr("fill", "#0f172a")
    .text("Fleet Statistics");

  const stats = [
    { label: "Pre-Pandemic", value: totalJan.toLocaleString(), color: dateInfo.jan.color },
    { label: "Peak Pandemic", value: totalApr.toLocaleString(), color: dateInfo.apr.color },
    { label: "Post-Pandemic", value: totalDec.toLocaleString(), color: dateInfo.dec.color }
  ];

  const labelFontSize = Math.min(9, panelWidth / 16);
  const valueFontSize = Math.min(10, panelWidth / 14);
  
  stats.forEach((stat, i) => {
    const yPos = 38 + i * 22;
    statsPanel.append("text")
      .attr("x", 10)
      .attr("y", yPos)
      .attr("font-size", labelFontSize)
      .attr("fill", "#64748b")
      .text(stat.label + ":");

    statsPanel.append("text")
      .attr("x", panelWidth - 10)
      .attr("y", yPos)
      .attr("text-anchor", "end")
      .attr("font-size", valueFontSize)
      .attr("font-weight", "600")
      .attr("fill", stat.color)
      .text(stat.value);
  });

  // Interactive legend - positioned below stats panel
  const legend = svg.append("g")
    .attr("transform", `translate(${panelX}, ${margin.top + panelHeight + 25})`);

  const legendFontSize = Math.min(11, panelWidth / 14);
  const clickToFilterY = 0;
  legend.append("text")
    .attr("x", panelWidth / 2)
    .attr("y", clickToFilterY)
    .attr("text-anchor", "middle")
    .attr("font-size", legendFontSize)
    .attr("font-weight", "600")
    .attr("fill", "#0f172a")
    .text("Click to Filter");

  const legendItems = periods.map((period, i) => ({
    period,
    label: dateInfo[period].label,
    subtitle: dateInfo[period].subtitle,
    color: dateInfo[period].color
  }));

  const legendItemSize = Math.min(16, panelWidth / 10);
  const legendTextSize = Math.min(10, panelWidth / 15);
  const legendSubtextSize = Math.min(8, panelWidth / 18);
  const legendItemSpacing = 32;
  const spacingAfterClickToFilter = 22;
  
  const hoveredLegendItems = new Set();
  const rectGroupMap = new Map();
  
  legendItems.forEach((item, i) => {
    const legendY = clickToFilterY + spacingAfterClickToFilter + i * legendItemSpacing;
    
    const rectGroup = legend.append("g")
      .attr("transform", `translate(${legendItemSize/2}, ${legendY + legendItemSize/2})`)
      .attr("data-period", item.period)
      .style("pointer-events", "none");
    
    rectGroupMap.set(item.period, { rectGroup, legendY, legendRect: null });
    
    const legendRect = rectGroup.append("rect")
      .attr("width", legendItemSize)
      .attr("height", legendItemSize)
      .attr("x", -legendItemSize/2)
      .attr("y", -legendItemSize/2)
      .attr("fill", item.color)
      .attr("rx", 3)
      .attr("opacity", () => highlightedPeriod === null || highlightedPeriod === item.period ? 1 : 0.3)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))")
      .attr("stroke", () => highlightedPeriod === item.period ? "#0f172a" : "none")
      .attr("stroke-width", () => highlightedPeriod === item.period ? 2 : 0)
      .style("transform-origin", "center center");
    
    rectGroupMap.get(item.period).legendRect = legendRect;
    
    const legendItem = legend.append("g")
      .attr("transform", `translate(0, ${legendY})`)
      .style("cursor", "pointer")
      .style("pointer-events", "none");
    
    const clickArea = legend.append("rect")
      .attr("x", 0)
      .attr("y", legendY - 8)
      .attr("width", panelWidth)
      .attr("height", legendItemSpacing - 4)
      .attr("fill", "transparent")
      .attr("opacity", 0)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", function() {
        if (highlightedPeriod === item.period) {
          highlightedPeriod = null;
          hoveredLegendItems.delete(item.period);
          const stored = rectGroupMap.get(item.period);
          if (stored) {
            const isActive = highlightedPeriod === null || highlightedPeriod === item.period;
            stored.rectGroup
              .interrupt()
              .transition()
              .duration(200)
              .ease(d3.easeQuadOut)
              .attr("transform", `translate(${legendItemSize/2}, ${stored.legendY + legendItemSize/2}) scale(1)`);
            if (stored.legendRect) {
              stored.legendRect
                .interrupt()
                .transition()
                .duration(200)
                .ease(d3.easeQuadOut)
                .attr("opacity", isActive ? 1 : 0.3)
                .attr("stroke", highlightedPeriod === item.period ? "#0f172a" : "none")
                .attr("stroke-width", highlightedPeriod === item.period ? 2 : 0)
                .style("filter", isActive ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");
            }
          }
        } else {
          hoveredLegendItems.forEach(period => {
            if (period !== item.period) {
              const stored = rectGroupMap.get(period);
              if (stored) {
                const isActive = highlightedPeriod === null || highlightedPeriod === period;
                stored.rectGroup
                  .interrupt()
                  .transition()
                  .duration(200)
                  .ease(d3.easeQuadOut)
                  .attr("transform", `translate(${legendItemSize/2}, ${stored.legendY + legendItemSize/2}) scale(1)`);
                if (stored.legendRect) {
                  stored.legendRect
                    .interrupt()
                    .transition()
                    .duration(200)
                    .ease(d3.easeQuadOut)
                    .attr("opacity", isActive ? 1 : 0.3)
                    .attr("stroke", highlightedPeriod === period ? "#0f172a" : "none")
                    .attr("stroke-width", highlightedPeriod === period ? 2 : 0)
                    .style("filter", isActive ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");
                }
              }
            }
          });
          hoveredLegendItems.clear();
          highlightedPeriod = item.period;
          hoveredLegendItems.add(item.period);
        }
        updateHighlighting();
        updateLegend();
      })
      .on("mouseenter", function() {
        d3.select(this).attr("fill", "rgba(0,0,0,0.03)");
        hoveredLegendItems.add(item.period);
        const stored = rectGroupMap.get(item.period);
        if (stored) {
          stored.rectGroup
            .interrupt()
            .attr("transform", `translate(${legendItemSize/2}, ${stored.legendY + legendItemSize/2}) scale(1.15)`);
          if (stored.legendRect) {
            stored.legendRect
              .interrupt()
              .attr("opacity", 1)
              .style("filter", "drop-shadow(0 3px 6px rgba(0,0,0,0.2))");
          }
        }
      })
      .on("mouseleave", function() {
        d3.select(this).attr("fill", "transparent");
        hoveredLegendItems.delete(item.period);
        const stored = rectGroupMap.get(item.period);
        if (stored) {
          const isActive = highlightedPeriod === null || highlightedPeriod === item.period;
          stored.rectGroup
            .interrupt()
            .attr("transform", `translate(${legendItemSize/2}, ${stored.legendY + legendItemSize/2}) scale(1)`);
          if (stored.legendRect) {
            stored.legendRect
              .interrupt()
              .attr("opacity", isActive ? 1 : 0.3)
              .attr("stroke", highlightedPeriod === item.period ? "#0f172a" : "none")
              .attr("stroke-width", highlightedPeriod === item.period ? 2 : 0)
              .style("filter", isActive ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");
          }
        }
      });

    legendItem.append("text")
      .attr("x", legendItemSize + 8)
      .attr("y", legendItemSize * 0.5 + 1)
      .attr("font-size", legendTextSize)
      .attr("fill", "#0f172a")
      .attr("font-weight", () => highlightedPeriod === item.period ? "600" : "500")
      .style("pointer-events", "none")
      .text(item.label);

    legendItem.append("text")
      .attr("x", legendItemSize + 8)
      .attr("y", legendItemSize + 9)
      .attr("font-size", legendSubtextSize)
      .attr("fill", "#64748b")
      .style("pointer-events", "none")
      .text(item.subtitle);

  });

  function updateLegend() {
    legendItems.forEach((item, i) => {
      if (hoveredLegendItems.has(item.period)) {
        return;
      }
      
      const stored = rectGroupMap.get(item.period);
      if (stored) {
        const isActive = highlightedPeriod === null || highlightedPeriod === item.period;
        
        stored.rectGroup
          .interrupt()
          .transition()
          .duration(200)
          .ease(d3.easeQuadOut)
          .attr("transform", `translate(${legendItemSize/2}, ${stored.legendY + legendItemSize/2}) scale(1)`);
        
        if (stored.legendRect) {
          stored.legendRect
            .interrupt()
            .transition()
            .duration(200)
            .ease(d3.easeQuadOut)
            .attr("opacity", isActive ? 1 : 0.3)
            .attr("stroke", highlightedPeriod === item.period ? "#0f172a" : "none")
            .attr("stroke-width", highlightedPeriod === item.period ? 2 : 0)
            .style("filter", isActive ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");
        }
      }
      
      const legendY = clickToFilterY + spacingAfterClickToFilter + i * legendItemSpacing;
      legend.selectAll("g").each(function() {
        const transform = d3.select(this).attr("transform");
        if (transform && transform.includes(`translate(0, ${legendY})`)) {
          d3.select(this).selectAll("text").each(function() {
            const textContent = d3.select(this).text();
            if (textContent === item.label) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr("font-weight", highlightedPeriod === item.period ? "600" : "500");
            }
          });
        }
      });
    });
  }
}

// Collision detection function to prevent label overlaps
function adjustLabelOverlaps(labelData, chartHeight) {
  if (!labelData || labelData.length === 0) return;
  
  // Estimate label height (font-size 10 + some padding)
  const labelHeight = 14;
  const labelPadding = 3; // Extra padding between labels
  const minY = 15; // Minimum y position
  const labelOffset = 12; // Standard offset from bar top
  
  // Sort labels by y position (top to bottom)
  const sortedLabels = [...labelData].filter(d => d.value > 0).sort((a, b) => a.y - b.y);
  
  // Multiple passes to resolve all overlaps
  let hasOverlaps = true;
  let iterations = 0;
  const maxIterations = 10;
  
  while (hasOverlaps && iterations < maxIterations) {
    hasOverlaps = false;
    iterations++;
    
    // Check for overlaps and adjust positions
    for (let i = 1; i < sortedLabels.length; i++) {
      const currentLabel = sortedLabels[i];
      const barTopY = currentLabel.barTopY;
      const maxAllowedY = barTopY - labelOffset; // Never go below this (never inside bar)
      
      // Check overlap with all previous labels
      for (let j = 0; j < i; j++) {
        const prevLabel = sortedLabels[j];
        
        // Check if labels are horizontally close (within bar width + some margin)
        const horizontalDistance = Math.abs(currentLabel.x - prevLabel.x);
        const maxHorizontalDistance = Math.max(currentLabel.barWidth, prevLabel.barWidth) / 2 + 15;
        
        if (horizontalDistance < maxHorizontalDistance) {
          const minVerticalDistance = labelHeight + labelPadding;
          
          // Ensure larger value is always above smaller value
          // If current label has larger value but is below prev label, swap positions
          if (currentLabel.value > prevLabel.value && currentLabel.y > prevLabel.y) {
            // Current has larger value but is positioned below - need to swap
            const tempY = currentLabel.y;
            const prevBarTopY = prevLabel.barTopY;
            const prevMaxAllowedY = prevBarTopY - labelOffset;
            
            // Try to move current (larger) label above prev (smaller) label
            const desiredY = prevLabel.y - minVerticalDistance;
            if (desiredY <= maxAllowedY && desiredY >= minY) {
              currentLabel.y = desiredY;
              // Move prev label down to make space
              prevLabel.y = currentLabel.y + minVerticalDistance;
              // Ensure prev label stays above its bar
              if (prevLabel.y > prevMaxAllowedY) {
                prevLabel.y = prevMaxAllowedY;
              }
              
              prevLabel.element
                .transition()
                .duration(200)
                .ease(d3.easeQuadOut)
                .attr("y", prevLabel.y);
              
              hasOverlaps = true;
            }
          } else if (prevLabel.value > currentLabel.value && prevLabel.y > currentLabel.y) {
            // Prev has larger value but is positioned below - need to swap
            const prevBarTopY = prevLabel.barTopY;
            const prevMaxAllowedY = prevBarTopY - labelOffset;
            
            // Try to move prev (larger) label above current (smaller) label
            const desiredY = currentLabel.y - minVerticalDistance;
            if (desiredY <= prevMaxAllowedY && desiredY >= minY) {
              prevLabel.y = desiredY;
              // Move current label down to make space
              currentLabel.y = prevLabel.y + minVerticalDistance;
              // Ensure current label stays above its bar
              if (currentLabel.y > maxAllowedY) {
                currentLabel.y = maxAllowedY;
              }
              
              prevLabel.element
                .transition()
                .duration(200)
                .ease(d3.easeQuadOut)
                .attr("y", prevLabel.y);
              
              hasOverlaps = true;
            }
          }
          
          // Check vertical overlap (after ensuring value order)
          const verticalDistance = currentLabel.y - prevLabel.y;
          
          if (verticalDistance < minVerticalDistance) {
            // Labels overlap - adjust positions ensuring larger value stays above
            hasOverlaps = true;
            
            if (currentLabel.value >= prevLabel.value) {
              // Current label has larger or equal value - should be above
              const desiredY = prevLabel.y - minVerticalDistance;
              
              // Keep label above bar: label.y must be <= barTopY - labelOffset (never inside bar)
              if (desiredY <= maxAllowedY) {
                // Can move current label up without going into bar
                currentLabel.y = Math.max(desiredY, minY);
              } else {
                // Can't move current label up enough - try moving previous label down
                const prevBarTopY = prevLabel.barTopY;
                const prevMaxAllowedY = prevBarTopY - labelOffset;
                // Move prev label down to create space for current label
                const prevDesiredY = maxAllowedY + minVerticalDistance;
                
                // Check if we can move previous label down without putting it inside its bar
                if (prevDesiredY <= prevMaxAllowedY && prevDesiredY >= minY) {
                  // Can move previous label down to create space
                  prevLabel.y = prevDesiredY;
                  prevLabel.element
                    .transition()
                    .duration(200)
                    .ease(d3.easeQuadOut)
                    .attr("y", prevLabel.y);
                  // Current label stays at maxAllowedY (above its bar)
                  currentLabel.y = maxAllowedY;
                } else {
                  // Both labels are constrained - keep current label at maxAllowedY
                  // This might still overlap slightly, but label stays above bar
                  currentLabel.y = maxAllowedY;
                }
              }
            } else {
              // Prev label has larger value - should be above, move current down
              const prevBarTopY = prevLabel.barTopY;
              const prevMaxAllowedY = prevBarTopY - labelOffset;
              const desiredY = prevLabel.y + minVerticalDistance;
              
              // Keep current label above its bar
              if (desiredY <= maxAllowedY) {
                currentLabel.y = desiredY;
              } else {
                // Can't move current down enough - try moving prev up
                const prevDesiredY = maxAllowedY - minVerticalDistance;
                if (prevDesiredY <= prevMaxAllowedY && prevDesiredY >= minY) {
                  prevLabel.y = prevDesiredY;
                  prevLabel.element
                    .transition()
                    .duration(200)
                    .ease(d3.easeQuadOut)
                    .attr("y", prevLabel.y);
                  currentLabel.y = maxAllowedY;
                } else {
                  currentLabel.y = maxAllowedY;
                }
              }
            }
            
            // Update the DOM element
            currentLabel.element
              .transition()
              .duration(200)
              .ease(d3.easeQuadOut)
              .attr("y", currentLabel.y);
          }
        }
      }
    }
    
    // Re-sort after adjustments
    sortedLabels.sort((a, b) => a.y - b.y);
  }
}

// Enhanced tooltip
let tooltip = null;

function showTooltip(event, d, period, periodInfo) {
  if (!tooltip) {
    tooltip = d3.select("body").append("div")
      .attr("class", "podium-tooltip")
      .style("position", "absolute")
      .style("background", "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))")
      .style("color", "white")
      .style("padding", "10px 14px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10000")
      .style("box-shadow", "0 6px 20px rgba(0,0,0,0.3)")
      .style("border", `1.5px solid ${periodInfo.color}`)
      .style("opacity", 0)
      .style("transition", "opacity 0.15s");
  }

  const change = d.trend.preToPeak;
  const trendIcon = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
  const trendText = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

  tooltip
    .html(`
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: ${periodInfo.color}">
        ${d.model}
      </div>
      <div style="margin-bottom: 3px; font-size: 11px; color: #cbd5e1;">
        ${periodInfo.label} • ${periodInfo.subtitle}
      </div>
      <div style="font-size: 16px; font-weight: 600; color: ${periodInfo.color}; margin: 3px 0;">
        ${d[period]} flights
      </div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px;">
        ${trendIcon} ${trendText}
      </div>
    `)
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 8) + "px")
    .style("opacity", 1);
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style("opacity", 0);
  }
}
