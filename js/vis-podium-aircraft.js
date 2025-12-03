// js/vis-podium-aircraft.js
// Y-axis removed - no numbers on y-axis

// Normalize model names helper function (shared)
// Merges variations like "737-800", "737 800", "737800", "BOEING 737-8AS" into a single normalized form
function normalizeModelName(modelName) {
  if (!modelName) return "";
  
  let normalized = modelName.trim().toUpperCase();
  
  // Remove common manufacturer prefixes (case-insensitive)
  // Handle various patterns: "BOEING ", "BOEING-", "BOEING737", "BOEING 737", etc.
  // Match manufacturer name followed by optional spaces/dashes or directly by model number
  normalized = normalized.replace(/^(BOEING|AIRBUS|BOMBARDIER|EMBRAER|MCDONNELL|MCDONNELL DOUGLAS|LOCKHEED|CESSNA|GULFSTREAM|DASSAULT|SAAB|ATR|ANTONOV|ILYUSHIN|TUPOLEV|SUKHOI)[\s\-]+/i, "");
  
  // Also handle cases where manufacturer is directly attached (no space): "BOEING737" -> "737"
  normalized = normalized.replace(/^(BOEING|AIRBUS|BOMBARDIER|EMBRAER|MCDONNELL|LOCKHEED|CESSNA|GULFSTREAM|DASSAULT|SAAB|ATR|ANTONOV|ILYUSHIN|TUPOLEV|SUKHOI)([0-9A-Z])/i, "$2");
  
  // Remove manufacturer if it appears anywhere else in the string (less common but possible)
  normalized = normalized.replace(/\b(BOEING|AIRBUS|BOMBARDIER|EMBRAER|MCDONNELL|LOCKHEED|CESSNA|GULFSTREAM|DASSAULT|SAAB|ATR|ANTONOV|ILYUSHIN|TUPOLEV|SUKHOI)\b[\s\-]*/gi, "");
  
  // Replace all whitespace (spaces, tabs, etc.) with dashes
  normalized = normalized.replace(/\s+/g, "-");
  
  // Normalize multiple dashes to single dash
  normalized = normalized.replace(/-+/g, "-");
  
  // Remove leading/trailing dashes
  normalized = normalized.replace(/^-+|-+$/g, "");
  
  return normalized;
}

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
    const modelInfoLookup = new Map(); // Lookup by model name for plane cards

    aircraftData.forEach(d => {
      if (d.icao24 && d.model) {
        aircraftLookup.set(d.icao24.toUpperCase(), {
          model: d.model,
          manufacturer: d.manufacturername || "Unknown",
          typecode: d.typecode || ""
        });
        
        // Store model info using normalized name as key
        const modelName = d.model.trim();
        const normalizedName = normalizeModelName(modelName);
        if (normalizedName && !modelInfoLookup.has(normalizedName)) {
          modelInfoLookup.set(normalizedName, {
            model: modelName,  // Keep original for display
            manufacturer: d.manufacturername || "Unknown",
            typecode: d.typecode || "",
            operator: d.operator || "",
            engines: d.engines || "",
            built: d.built || ""
          });
        }
      }
    });

    // Load flight data for three periods
    const dateInfo = {
      'jan': { 
        file: 'globe/flights100k-jan1.csv', 
        label: 'Jan 2019', 
        color: '#2563eb',
        gradient: ['#2563eb', '#3b82f6'],
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

    // Normalize model names to merge variations (e.g., "737-800" vs "737 800" vs "737800")
    // Using the shared normalizeModelName function defined at the top of the file

    // Map normalized names to original names (keep the most common original)
    const normalizedToOriginal = new Map();
    const originalCounts = {};

    // Count aircraft models per period with normalization
    const modelCounts = {};
    
    for (const [period, flights] of Object.entries(allFlights)) {
      const counts = {};
      flights.forEach(f => {
        const icao24 = (f.icao24 || "").toUpperCase();
        const aircraft = aircraftLookup.get(icao24);
        if (aircraft && aircraft.model) {
          const originalModel = aircraft.model.trim();
          if (originalModel) {
            const normalizedModel = normalizeModelName(originalModel);
            
            // Track original model names
            if (!originalCounts[normalizedModel]) {
              originalCounts[normalizedModel] = {};
            }
            originalCounts[normalizedModel][originalModel] = 
              (originalCounts[normalizedModel][originalModel] || 0) + 1;
            
            // Count using normalized name
            counts[normalizedModel] = (counts[normalizedModel] || 0) + 1;
          }
        }
      });
      modelCounts[period] = counts;
    }

    // Determine the most common original name for each normalized model
    // Normalize display names to remove manufacturer prefixes
    Object.keys(originalCounts).forEach(normalized => {
      const originals = originalCounts[normalized];
      const originalKeys = Object.keys(originals);
      
      // Find the most common original name
      const mostCommon = originalKeys.reduce((a, b) => 
        originals[a] > originals[b] ? a : b
      );
      
      // Normalize the display name to remove manufacturer prefixes
      // This ensures "BOEING 737-8AS" becomes "737-8AS" for display
      const displayName = normalizeModelName(mostCommon);
      normalizedToOriginal.set(normalized, displayName);
    });

    // Get top models across all periods (using normalized names)
    const allModels = new Set();
    Object.values(modelCounts).forEach(counts => {
      Object.keys(counts).forEach(model => allModels.add(model));
    });

    // Calculate total counts and get top 10 models (using normalized names)
    const modelTotals = {};
    allModels.forEach(model => {
      modelTotals[model] = Object.values(modelCounts)
        .reduce((sum, counts) => sum + (counts[model] || 0), 0);
    });

    const topModels = Array.from(allModels)
      .sort((a, b) => modelTotals[b] - modelTotals[a])
      .slice(0, 10);

    // Prepare data for grouped bar chart
    // Use the most common original name for display, but normalized name for counting
    const chartData = topModels.map(normalizedModel => {
      const displayModel = normalizedToOriginal.get(normalizedModel) || normalizedModel;
      return {
        model: displayModel,  // Display the most common original name
        normalizedModel: normalizedModel,  // Keep normalized for internal use
        jan: modelCounts.jan?.[normalizedModel] || 0,
        apr: modelCounts.apr?.[normalizedModel] || 0,
        dec: modelCounts.dec?.[normalizedModel] || 0,
        total: modelTotals[normalizedModel],
        // Calculate trends
        trend: {
          preToPeak: modelCounts.jan?.[normalizedModel] || 0 > 0 
            ? ((modelCounts.apr?.[normalizedModel] || 0) - (modelCounts.jan?.[normalizedModel] || 0)) / (modelCounts.jan?.[normalizedModel] || 1) * 100
            : 0,
          peakToPost: modelCounts.apr?.[normalizedModel] || 0 > 0
            ? ((modelCounts.dec?.[normalizedModel] || 0) - (modelCounts.apr?.[normalizedModel] || 0)) / (modelCounts.apr?.[normalizedModel] || 1) * 100
            : 0
        }
      };
    });

    clearInterval(loadingInterval);
    svg.selectAll("*").remove();
    drawGroupedBarChart(svg, chartData, dateInfo, viewBoxWidth, viewBoxHeight, allFlights, modelInfoLookup);

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

function drawGroupedBarChart(svg, data, dateInfo, width, height, allFlights, modelInfoLookup) {
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
        } else {
          highlightedPeriod = period;
        }
        
        // Update all bars directly, including hovered ones
        periods.forEach(p => {
          g.selectAll(`rect.${p}`)
            .each(function(barData) {
              const barId = `${barData.model}-${p}`;
              const isHovered = hoveredBars.has(barId);
              const isHighlighted = highlightedPeriod === null || highlightedPeriod === p;
              
              d3.select(this)
                .interrupt()
                .transition()
                .duration(300)
                .ease(d3.easeQuadOut)
                .attr("opacity", isHighlighted ? (isHovered ? 1 : 0.85) : 0.2)
                .style("filter", isHighlighted ? (isHovered ? "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" : "drop-shadow(0 1px 3px rgba(0,0,0,0.12))") : "drop-shadow(0 1px 3px rgba(0,0,0,0.12))");
            });
        });
        
        updateLegend();
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

  // Add aircraft model names under each bar group with hover functionality
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
    .style("cursor", "pointer")
    .style("text-decoration", "underline")
    .style("text-decoration-color", "transparent")
    .text(d => d.model)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("fill", "#1e40af")
        .style("text-decoration-color", "#1e40af")
        .attr("font-weight", "600");
      showPlaneCard(event, d, dateInfo, modelInfoLookup);
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .attr("fill", "#475569")
        .style("text-decoration-color", "transparent")
        .attr("font-weight", "500");
      hidePlaneCard();
    });

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
  const panelHeight = 120; // Adjusted height for spacing
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

  const labelFontSize = Math.min(13, panelWidth / 11);
  const valueFontSize = Math.min(10, panelWidth / 14);
  
  stats.forEach((stat, i) => {
    const yPos = 38 + i * 26;
    statsPanel.append("text")
      .attr("x", 10)
      .attr("y", yPos)
      .attr("font-size", labelFontSize)
      .attr("font-weight", "600")
      .attr("fill", "#475569")
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
    .text("Click to Highlight");

  const legendItems = periods.map((period, i) => ({
    period,
    label: dateInfo[period].label,
    subtitle: dateInfo[period].subtitle,
    color: dateInfo[period].color
  }));

  const legendItemSize = Math.min(16, panelWidth / 10);
  const legendTextSize = Math.min(10, panelWidth / 15);
  const legendSubtextSize = Math.min(13, panelWidth / 11);
  const legendItemSpacing = 35;
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
      .attr("font-weight", "600")
      .attr("fill", "#475569")
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

// Helper function to get aircraft image URL (using Wikimedia Commons as primary, JetPhotos as fallback)
function getAircraftImageUrl(modelName, variant = "") {
  // Use Wikimedia Commons for reliable image hosting
  // Format: https://commons.wikimedia.org/wiki/File:filename.jpg
  // For now, we'll use a search-based approach with fallbacks
  const searchTerm = encodeURIComponent(modelName.replace(/\s+/g, '_'));
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg`;
}

// Aircraft database with photos from JetPhotos, descriptions, variant info, and physical specs
const aircraftDatabase = {
  "737-800": {
    image: "https://brix.afklcargo.com/otf/images/media/97085C1E-0CF3-49C2-B22461DE22C4C9C6",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-800",
    variantInfo: "The Boeing 737-800 is the best-selling variant of the 737 Next Generation family. Introduced in 1998, it features improved fuel efficiency, extended range, and increased passenger capacity compared to earlier 737 models. This variant became the backbone of many airlines' fleets due to its reliability and operational flexibility.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "A popular narrow-body airliner, the 737-800 is Boeing's best-selling aircraft. Known for its reliability and fuel efficiency, it's a workhorse of short to medium-haul routes.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737NG 8K2/W": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-800 (8K2/W)",
    variantInfo: "The 737-800 variant with winglet modifications (8K2/W designation). Winglets improve fuel efficiency by reducing wingtip vortices, resulting in up to 5% better fuel economy. This modification became standard on newer 737-800s and can be retrofitted to older aircraft.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737 Next Generation variant with advanced winglet technology, featuring improved fuel efficiency and reduced drag.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,900 km (3,666 mi)",
    capacity: "162-189 passengers"
  },
  "737NG 82R/W": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-800 (82R/W)",
    variantInfo: "Another 737-800 variant designation indicating specific airline configuration and winglet installation. The '82R' typically refers to airline-specific cabin configurations, while 'W' indicates winglet-equipped aircraft. These variants are optimized for specific route requirements.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737 Next Generation variant with airline-specific configuration and winglet technology.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,900 km (3,666 mi)",
    capacity: "162-189 passengers"
  },
  "737NG 783": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-800 (783)",
    variantInfo: "The 737-800 variant with specific airline configuration code '783'. These codes indicate customized cabin layouts, seating arrangements, and service configurations tailored to individual airline requirements. The 783 variant is commonly used by European carriers.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737 Next Generation variant with airline-specific cabin configuration optimized for European routes.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737NG 8FE/W": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-800 (8FE/W)",
    variantInfo: "A 737-800 variant with '8FE' configuration code and winglet installation. The 'FE' designation often relates to specific engine options or fuel efficiency packages. Combined with winglets, this variant offers optimal fuel economy for long-range narrow-body operations.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737 Next Generation variant optimized for fuel efficiency with advanced winglet technology.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,900 km (3,666 mi)",
    capacity: "162-189 passengers"
  },
  "737-824": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-800",
    variant: "737-824",
    variantInfo: "The Boeing 737-824 is a specific variant configured for United Airlines (the '24' suffix indicates United's configuration). This variant features United's signature interior design, specific seating arrangements, and entertainment systems. It's optimized for United's route network and operational requirements.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-800 variant specifically configured for United Airlines, featuring airline-specific cabin layouts and service configurations.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737-8AS": {
    image: "https://www.baaa-acro.com/sites/default/files/styles/crash_detail_page_image_style_1000x505_/public/import/uploads/2008/11/EI-DYG.jpg?itok=397KrmWz",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-8AS",
    variant: "737-8AS",
    variantInfo: "The Boeing 737-8AS is a variant of the 737-800 family. The '8AS' designation indicates specific airline configuration and engine options. This variant features airline-specific cabin layouts, seating arrangements, and service configurations optimized for specific route requirements.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-8AS, a variant of the 737-800 family with airline-specific configuration. Features improved fuel efficiency and operational flexibility.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737 823": {
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_CyyvXbs40EemxvZIVF3mnNUUxpugRU-WqQ&s",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-823",
    variant: "737-823",
    variantInfo: "The Boeing 737-823 is a specific variant of the 737-800 family. The '823' designation indicates specific airline configuration and engine options. This variant features airline-specific cabin layouts, seating arrangements, and service configurations optimized for specific route requirements.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-823, a variant of the 737-800 family with airline-specific configuration. Features improved fuel efficiency and operational flexibility.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737-823": {
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_CyyvXbs40EemxvZIVF3mnNUUxpugRU-WqQ&s",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-823",
    variant: "737-823",
    variantInfo: "The Boeing 737-823 is a specific variant of the 737-800 family. The '823' designation indicates specific airline configuration and engine options. This variant features airline-specific cabin layouts, seating arrangements, and service configurations optimized for specific route requirements.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-823, a variant of the 737-800 family with airline-specific configuration. Features improved fuel efficiency and operational flexibility.",
    length: "39.5 m (129 ft 7 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "5,765 km (3,582 mi)",
    capacity: "162-189 passengers"
  },
  "737 7H4": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/438/438097_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-7H4",
    variant: "737-7H4",
    variantInfo: "The Boeing 737-7H4 is a specific variant of the 737-700 family. The '7H4' designation indicates specific airline configuration and engine options. The 737-700 is a shorter variant of the 737 Next Generation family, offering improved fuel efficiency and range compared to earlier 737 models while maintaining the same cockpit and systems as larger 737 variants.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-7H4, a variant of the 737-700 family with airline-specific configuration. Features improved fuel efficiency and operational flexibility.",
    length: "33.6 m (110 ft 4 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "6,230 km (3,871 mi)",
    capacity: "126-149 passengers"
  },
  "737-7H4": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/438/438097_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/737-7H4",
    variant: "737-7H4",
    variantInfo: "The Boeing 737-7H4 is a specific variant of the 737-700 family. The '7H4' designation indicates specific airline configuration and engine options. The 737-700 is a shorter variant of the 737 Next Generation family, offering improved fuel efficiency and range compared to earlier 737 models while maintaining the same cockpit and systems as larger 737 variants.",
    baseModel: "Boeing 737 Next Generation",
    firstFlight: "1997",
    description: "Boeing 737-7H4, a variant of the 737-700 family with airline-specific configuration. Features improved fuel efficiency and operational flexibility.",
    length: "33.6 m (110 ft 4 in)",
    wingspan: "35.8 m (117 ft 5 in)",
    height: "12.5 m (41 ft 2 in)",
    maxSpeed: "Mach 0.82 (876 km/h)",
    range: "6,230 km (3,871 mi)",
    capacity: "126-149 passengers"
  },
  "A319": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Airbus_A319-111%2C_Lufthansa_AN1857502.jpg/800px-Airbus_A319-111%2C_Lufthansa_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A319",
    variant: "A319",
    variantInfo: "The Airbus A319 is the smallest member of the A320 family, designed for shorter routes and smaller airports. Its compact size allows it to operate from runways as short as 1,800 meters, making it ideal for regional routes and challenging airports. Despite its smaller size, it maintains the same cockpit and systems as larger A320 family members, reducing pilot training costs.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1995",
    description: "Airbus A319, the smallest member of the A320 family. Known for its versatility and ability to operate from shorter runways, making it ideal for regional routes.",
    length: "33.84 m (111 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,850 km (4,257 mi)",
    capacity: "124-156 passengers"
  },
  "A319 133": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Airbus_A319-111%2C_Lufthansa_AN1857502.jpg/800px-Airbus_A319-111%2C_Lufthansa_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A319",
    variant: "A319-133",
    variantInfo: "The A319-133 variant features specific engine and configuration options. The '133' designation typically refers to CFM56-5B5/P engines and specific performance characteristics. This variant is popular among airlines requiring optimal fuel efficiency on shorter routes while maintaining the flexibility to operate longer sectors when needed.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1995",
    description: "Airbus A319 variant with CFM56 engines, optimized for regional and short-haul operations.",
    length: "33.84 m (111 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,850 km (4,257 mi)",
    capacity: "124-156 passengers"
  },
  "AIRBUS A319-111": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Airbus_A319-111%2C_Lufthansa_AN1857502.jpg/800px-Airbus_A319-111%2C_Lufthansa_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A319-111",
    variant: "A319-111",
    variantInfo: "The A319-111 is the baseline variant of the A319 family, powered by CFM56-5B5 or IAE V2500-A5 engines. This variant was the first A319 to enter service and established the model's reputation for reliability and operational flexibility. It's particularly valued for its ability to serve both high-density short routes and longer thin routes efficiently.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1995",
    description: "Airbus A319-111, the baseline variant of the A319 family, known for its operational flexibility and reliability.",
    length: "33.84 m (111 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,850 km (4,257 mi)",
    capacity: "124-156 passengers"
  },
  "A320": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Airbus_A320-214%2C_JetBlue_Airways_AN1857502.jpg/800px-Airbus_A320-214%2C_JetBlue_Airways_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320",
    variant: "A320",
    variantInfo: "The Airbus A320 revolutionized single-aisle aircraft with its fly-by-wire technology and commonality across the A320 family. As the baseline model, it strikes an optimal balance between capacity and range. The A320's advanced flight control systems, spacious cabin, and fuel efficiency made it a direct competitor to the Boeing 737 and helped establish Airbus as a major player in the narrow-body market.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320, a revolutionary narrow-body airliner that introduced fly-by-wire technology to single-aisle aircraft. A direct competitor to the Boeing 737.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320 214": {
    image: "https://cdn.plnspttrs.net/33574/rp-c4101-cebu-pacific-airbus-a320-214-wl_PlanespottersNet_1829306_ab010bfbb3_o.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-214",
    variant: "A320-214",
    variantInfo: "The Airbus A320-214 is a specific variant of the A320 family featuring CFM56-5B4/P engines. The '214' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-214, a variant of the A320 family with CFM56 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320-214": {
    image: "https://cdn.plnspttrs.net/33574/rp-c4101-cebu-pacific-airbus-a320-214-wl_PlanespottersNet_1829306_ab010bfbb3_o.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-214",
    variant: "A320-214",
    variantInfo: "The Airbus A320-214 is a specific variant of the A320 family featuring CFM56-5B4/P engines. The '214' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-214, a variant of the A320 family with CFM56 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320 214SL": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/447516/medium-large.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-214SL",
    variant: "A320-214SL",
    variantInfo: "The Airbus A320-214SL is a specific variant of the A320 family. The '214' designation indicates CFM56-5B4/P engines, while 'SL' refers to 'Sharklet' wingtip devices that improve fuel efficiency. This variant combines specific engine options with advanced wingtip technology to optimize fuel consumption and reduce emissions.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-214SL, a variant of the A320 family with CFM56 engines and Sharklet wingtip devices for improved fuel efficiency.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320-214SL": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/447516/medium-large.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-214SL",
    variant: "A320-214SL",
    variantInfo: "The Airbus A320-214SL is a specific variant of the A320 family. The '214' designation indicates CFM56-5B4/P engines, while 'SL' refers to 'Sharklet' wingtip devices that improve fuel efficiency. This variant combines specific engine options with advanced wingtip technology to optimize fuel consumption and reduce emissions.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-214SL, a variant of the A320 family with CFM56 engines and Sharklet wingtip devices for improved fuel efficiency.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320 232": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/486385/medium-large.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-232",
    variant: "A320-232",
    variantInfo: "The Airbus A320-232 is a specific variant of the A320 family featuring IAE V2500-A5 engines. The '232' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-232, a variant of the A320 family with IAE V2500 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320-232": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/486385/medium-large.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-232",
    variant: "A320-232",
    variantInfo: "The Airbus A320-232 is a specific variant of the A320 family featuring IAE V2500-A5 engines. The '232' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-232, a variant of the A320 family with IAE V2500 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320 231": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/434/434243_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-231",
    variant: "A320-231",
    variantInfo: "The Airbus A320-231 is a specific variant of the A320 family featuring IAE V2500-A1 engines. The '231' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-231, a variant of the A320 family with IAE V2500 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A320-231": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/434/434243_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A320-231",
    variant: "A320-231",
    variantInfo: "The Airbus A320-231 is a specific variant of the A320 family featuring IAE V2500-A1 engines. The '231' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A320's revolutionary fly-by-wire technology and commonality with other A320 family members, while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1987",
    description: "Airbus A320-231, a variant of the A320 family with IAE V2500 engines. Features the same advanced fly-by-wire technology and fuel efficiency as the baseline A320.",
    length: "37.57 m (123 ft 3 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "6,150 km (3,822 mi)",
    capacity: "150-180 passengers"
  },
  "A321": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Airbus_A321-211%2C_Lufthansa_AN1857502.jpg/800px-Airbus_A321-211%2C_Lufthansa_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A321",
    variant: "A321",
    variantInfo: "The Airbus A321 is the stretched variant of the A320 family, offering the highest passenger capacity while maintaining the same cockpit and systems. Its extended fuselage allows airlines to serve high-density routes efficiently. The A321 has become particularly popular for transcontinental routes, offering near wide-body capacity with narrow-body operating costs. Later variants like the A321neo and A321XLR extend its range significantly.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1993",
    description: "Airbus A321, the largest member of the A320 family. Offers increased capacity while maintaining the efficiency and reliability of the A320 series.",
    length: "44.51 m (146 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "5,950 km (3,698 mi)",
    capacity: "185-236 passengers"
  },
  "A321 231": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/434/434243_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A321-231",
    variant: "A321-231",
    variantInfo: "The Airbus A321-231 is a specific variant of the A321 family featuring IAE V2500-A5 engines. The '231' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A321's extended fuselage and high passenger capacity while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1993",
    description: "Airbus A321-231, a variant of the A321 family with IAE V2500 engines. Features the same extended fuselage and high capacity as the baseline A321.",
    length: "44.51 m (146 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "5,950 km (3,698 mi)",
    capacity: "185-236 passengers"
  },
  "A321-231": {
    image: "https://d3trj3zqmkebtg.cloudfront.net/pics/434/434243_big.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A321-231",
    variant: "A321-231",
    variantInfo: "The Airbus A321-231 is a specific variant of the A321 family featuring IAE V2500-A5 engines. The '231' designation indicates specific engine and configuration options optimized for various airline requirements. This variant maintains the A321's extended fuselage and high passenger capacity while offering specific performance characteristics suited to different route profiles.",
    baseModel: "Airbus A320 Family",
    firstFlight: "1993",
    description: "Airbus A321-231, a variant of the A321 family with IAE V2500 engines. Features the same extended fuselage and high capacity as the baseline A321.",
    length: "44.51 m (146 ft 0 in)",
    wingspan: "34.10 m (111 ft 10 in)",
    height: "11.76 m (38 ft 7 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "5,950 km (3,698 mi)",
    capacity: "185-236 passengers"
  },
  "A330": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Airbus_A330-343%2C_Cathay_Pacific_AN1857502.jpg/800px-Airbus_A330-343%2C_Cathay_Pacific_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A330",
    variant: "A330",
    variantInfo: "The Airbus A330 is a wide-body twin-engine airliner that has become one of the most successful wide-body aircraft in history. It offers exceptional range and fuel efficiency for both medium and long-haul routes. The A330's versatility allows airlines to deploy it on routes ranging from 4,000 to 13,000 km, making it a workhorse for international operations. Its commonality with the A340 (four-engine variant) reduces training and maintenance costs.",
    baseModel: "Airbus A330 Family",
    firstFlight: "1992",
    description: "Airbus A330, a wide-body twin-engine airliner. Known for its long-range capabilities and fuel efficiency, serving both medium and long-haul routes.",
    length: "58.82 m (193 ft 0 in)",
    wingspan: "60.3 m (197 ft 10 in)",
    height: "17.39 m (57 ft 1 in)",
    maxSpeed: "Mach 0.86 (913 km/h)",
    range: "13,450 km (8,355 mi)",
    capacity: "250-440 passengers"
  },
  "A350": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Airbus_A350-941%2C_Singapore_Airlines_AN1857502.jpg/800px-Airbus_A350-941%2C_Singapore_Airlines_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A350",
    variant: "A350",
    variantInfo: "The Airbus A350 represents the latest generation of wide-body aircraft, featuring over 50% composite materials in its construction. This advanced design reduces weight significantly while maintaining structural integrity. The A350's cabin features larger windows, improved humidity control, and advanced LED lighting systems that adapt to time zones, reducing jet lag. Its fuel efficiency is up to 25% better than previous-generation wide-body aircraft, making it a game-changer for long-haul operations.",
    baseModel: "Airbus A350 Family",
    firstFlight: "2013",
    description: "Airbus A350, a modern wide-body airliner featuring advanced aerodynamics and composite materials. Designed for long-haul routes with exceptional fuel efficiency.",
    length: "66.8 m (219 ft 2 in)",
    wingspan: "64.75 m (212 ft 5 in)",
    height: "17.05 m (55 ft 11 in)",
    maxSpeed: "Mach 0.89 (945 km/h)",
    range: "15,000 km (9,321 mi)",
    capacity: "325-410 passengers"
  },
  "787-8": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Boeing_787-8_Dreamliner%2C_ANA_AN1857502.jpg/800px-Boeing_787-8_Dreamliner%2C_ANA_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/787-8",
    variant: "787-8",
    variantInfo: "The Boeing 787-8 Dreamliner is the smallest variant of the 787 family, but it revolutionized long-haul travel with its composite construction and advanced systems. Over 50% of the aircraft is made from composite materials, reducing weight and improving fuel efficiency by up to 20% compared to similar-sized aircraft. The 787-8 features larger windows, improved cabin pressure (equivalent to 6,000 feet instead of 8,000 feet), and advanced air filtration systems. Its range allows airlines to open new point-to-point routes previously not economically viable.",
    baseModel: "Boeing 787 Dreamliner",
    firstFlight: "2009",
    description: "Boeing 787 Dreamliner, a revolutionary wide-body aircraft made primarily of composite materials. Features larger windows, improved cabin pressure, and exceptional fuel efficiency.",
    length: "57 m (186 ft 11 in)",
    wingspan: "60.12 m (197 ft 3 in)",
    height: "16.92 m (55 ft 6 in)",
    maxSpeed: "Mach 0.85 (903 km/h)",
    range: "13,620 km (8,465 mi)",
    capacity: "242 passengers"
  },
  "Boeing 787 8": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Boeing_787-8_Dreamliner%2C_ANA_AN1857502.jpg/800px-Boeing_787-8_Dreamliner%2C_ANA_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/787-8",
    variant: "787-8",
    variantInfo: "The Boeing 787-8 Dreamliner is the smallest variant of the 787 family, but it revolutionized long-haul travel with its composite construction and advanced systems. Over 50% of the aircraft is made from composite materials, reducing weight and improving fuel efficiency by up to 20% compared to similar-sized aircraft. The 787-8 features larger windows, improved cabin pressure (equivalent to 6,000 feet instead of 8,000 feet), and advanced air filtration systems. Its range allows airlines to open new point-to-point routes previously not economically viable.",
    baseModel: "Boeing 787 Dreamliner",
    firstFlight: "2009",
    description: "Boeing 787 Dreamliner, a revolutionary wide-body aircraft made primarily of composite materials. Features larger windows, improved cabin pressure, and exceptional fuel efficiency.",
    length: "57 m (186 ft 11 in)",
    wingspan: "60.12 m (197 ft 3 in)",
    height: "16.92 m (55 ft 6 in)",
    maxSpeed: "Mach 0.85 (903 km/h)",
    range: "13,620 km (8,465 mi)",
    capacity: "242 passengers"
  },
  "777-300ER": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Boeing_777-300ER%2C_Emirates_AN1857502.jpg/800px-Boeing_777-300ER%2C_Emirates_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/777-300ER",
    variant: "777-300ER",
    variantInfo: "The Boeing 777-300ER (Extended Range) is one of the most successful wide-body aircraft ever built. The 'ER' designation indicates enhanced fuel capacity and improved engines, allowing it to fly longer routes than the standard 777-300. This variant features raked wingtips that improve fuel efficiency and reduce drag. The 777-300ER's reliability and range have made it the preferred choice for many airlines' longest routes, often replacing four-engine aircraft due to its superior fuel efficiency while maintaining similar capacity.",
    baseModel: "Boeing 777",
    firstFlight: "2003",
    description: "Boeing 777-300ER, an extended-range variant of the 777. One of the world's most successful wide-body aircraft, known for its reliability and long-range capabilities.",
    length: "73.9 m (242 ft 4 in)",
    wingspan: "64.8 m (212 ft 7 in)",
    height: "18.5 m (60 ft 8 in)",
    maxSpeed: "Mach 0.84 (893 km/h)",
    range: "14,685 km (9,125 mi)",
    capacity: "365-550 passengers"
  },
  "CRJ-900": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bombardier_CRJ900%2C_United_Express_AN1857502.jpg/800px-Bombardier_CRJ900%2C_United_Express_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/CRJ-900",
    variant: "CRJ-900",
    variantInfo: "The Bombardier CRJ-900 is the largest variant of the CRJ (Canadair Regional Jet) family, stretching the CRJ-700 design to accommodate more passengers. This regional jet bridges the gap between smaller regional aircraft and mainline narrow-body jets. The CRJ-900 features improved fuel efficiency over earlier CRJ models and offers mainline-style amenities in a regional aircraft. Its extended range allows it to serve routes up to 3,400 km, making it suitable for longer regional routes that don't justify larger aircraft.",
    baseModel: "Bombardier CRJ Series",
    firstFlight: "2001",
    description: "Bombardier CRJ-900, a regional jet designed for short to medium-haul routes. Features improved fuel efficiency and passenger comfort compared to earlier CRJ models.",
    length: "36.4 m (119 ft 5 in)",
    wingspan: "24.85 m (81 ft 6 in)",
    height: "7.51 m (24 ft 8 in)",
    maxSpeed: "Mach 0.83 (882 km/h)",
    range: "3,417 km (2,123 mi)",
    capacity: "76-90 passengers"
  },
  "CL-600-2C10": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bombardier_CRJ900%2C_United_Express_AN1857502.jpg/800px-Bombardier_CRJ900%2C_United_Express_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/CL-600-2C10",
    variant: "CL-600-2C10 (CRJ-700)",
    variantInfo: "The CL-600-2C10 is Bombardier's official designation for the CRJ-700 regional jet. This variant features improved fuel efficiency and passenger comfort compared to earlier CRJ models. The '2C10' designation indicates specific engine and systems configurations. This variant is widely used by major airlines for regional operations.",
    baseModel: "Bombardier CRJ Series",
    firstFlight: "1999",
    description: "Bombardier CL-600-2C10 (CRJ-700), a regional jet variant designed for short to medium-haul routes with improved fuel efficiency.",
    length: "32.51 m (106 ft 8 in)",
    wingspan: "23.24 m (76 ft 3 in)",
    height: "7.57 m (24 ft 10 in)",
    maxSpeed: "Mach 0.83 (882 km/h)",
    range: "3,650 km (2,268 mi)",
    capacity: "68-70 passengers"
  },
  "CL-600-2D24": {
    image: "https://c.flyradius.com/images/bombardier-crj900/bombardier-cl-600-2d24.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/CL-600-2D24",
    variant: "CL-600-2D24 (CRJ-900)",
    variantInfo: "The CL-600-2D24 is Bombardier's official designation for the CRJ-900 regional jet. This variant features the same airframe as the CRJ-900 but with specific certification and configuration details. The '2D24' designation indicates specific engine and systems configurations. This variant is widely used by major airlines for regional operations, offering mainline comfort in a smaller package.",
    baseModel: "Bombardier CRJ Series",
    firstFlight: "2001",
    description: "Bombardier CL-600-2D24 (CRJ-900), a regional jet variant designed for short to medium-haul routes with improved fuel efficiency.",
    length: "36.4 m (119 ft 5 in)",
    wingspan: "24.85 m (81 ft 6 in)",
    height: "7.51 m (24 ft 8 in)",
    maxSpeed: "Mach 0.83 (882 km/h)",
    range: "3,417 km (2,123 mi)",
    capacity: "76-90 passengers"
  },
  "CRJ 900": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bombardier_CRJ900%2C_United_Express_AN1857502.jpg/800px-Bombardier_CRJ900%2C_United_Express_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/CRJ-900",
    variant: "CRJ-900",
    variantInfo: "The Bombardier CRJ-900 is the largest variant of the CRJ (Canadair Regional Jet) family, stretching the CRJ-700 design to accommodate more passengers. This regional jet bridges the gap between smaller regional aircraft and mainline narrow-body jets.",
    baseModel: "Bombardier CRJ Series",
    firstFlight: "2001",
    description: "Bombardier CRJ-900, a regional jet designed for short to medium-haul routes.",
    length: "36.4 m (119 ft 5 in)",
    wingspan: "24.85 m (81 ft 6 in)",
    height: "7.51 m (24 ft 8 in)",
    maxSpeed: "Mach 0.83 (882 km/h)",
    range: "3,417 km (2,123 mi)",
    capacity: "76-90 passengers"
  },
  "ERJ-190": {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Embraer_ERJ-190%2C_JetBlue_AN1857502.jpg/800px-Embraer_ERJ-190%2C_JetBlue_AN1857502.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/ERJ-190",
    variant: "ERJ-190",
    variantInfo: "The Embraer ERJ-190 (E-Jet E190) is part of Embraer's E-Jet family, designed to compete directly with smaller narrow-body aircraft. Unlike traditional regional jets, the ERJ-190 features a wider cabin (similar to mainline aircraft) with a 2+2 seating configuration, eliminating the middle seat. This design provides mainline comfort in a smaller aircraft, making it popular for routes that don't justify larger jets. The ERJ-190's range and capacity make it ideal for connecting smaller cities to major hubs or serving high-frequency short-haul routes.",
    baseModel: "Embraer E-Jet Family",
    firstFlight: "2004",
    description: "Embraer ERJ-190, a modern regional jet offering mainline comfort in a smaller aircraft. Popular for connecting smaller cities to major hubs.",
    length: "36.24 m (118 ft 11 in)",
    wingspan: "28.72 m (94 ft 3 in)",
    height: "10.28 m (33 ft 9 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "4,260 km (2,648 mi)",
    capacity: "98-114 passengers"
  },
  "ERJ 170-200 LR": {
    image: "https://cdn.plnspttrs.net/35656/n86372-united-express-embraer-erj-175ll-erj-170-200-ll_PlanespottersNet_1794675_3097eb88f3_o.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/ERJ-170-200-LR",
    variant: "ERJ 170-200 LR",
    variantInfo: "The Embraer ERJ 170-200 LR (Long Range) is an extended-range variant of the ERJ 170, part of Embraer's E-Jet family. The LR designation indicates enhanced fuel capacity and improved engines, allowing it to fly longer routes than the standard ERJ 170-200. This variant is commonly used by regional airlines operating as feeders for major carriers, connecting smaller cities to major hubs.",
    baseModel: "Embraer E-Jet Family",
    firstFlight: "2002",
    description: "Embraer ERJ 170-200 LR, an extended-range regional jet variant designed for longer regional routes.",
    length: "29.9 m (98 ft 1 in)",
    wingspan: "26.0 m (85 ft 4 in)",
    height: "9.7 m (31 ft 10 in)",
    maxSpeed: "Mach 0.82 (871 km/h)",
    range: "3,889 km (2,417 mi)",
    capacity: "70-80 passengers"
  },
  "A300 214": {
    image: "https://cdn.jetphotos.com/full/6/10193_1639374731.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A300-214",
    variant: "A300-214",
    variantInfo: "The Airbus A300-214 is a variant of the A300 wide-body twin-engine airliner. The A300 was the first twin-engine wide-body aircraft and pioneered many technologies later used in other Airbus aircraft. The -214 variant features specific engine and configuration options, making it suitable for medium to long-haul routes. The A300's innovative design and fuel efficiency made it popular with airlines worldwide.",
    baseModel: "Airbus A300",
    firstFlight: "1972",
    description: "Airbus A300-214, a wide-body twin-engine airliner. The A300 was the first twin-engine wide-body aircraft and pioneered many modern aviation technologies.",
    length: "54.08 m (177 ft 5 in)",
    wingspan: "44.84 m (147 ft 1 in)",
    height: "16.53 m (54 ft 3 in)",
    maxSpeed: "Mach 0.86 (913 km/h)",
    range: "7,500 km (4,660 mi)",
    capacity: "266-345 passengers"
  },
  "A300-214": {
    image: "https://cdn.jetphotos.com/full/6/10193_1639374731.jpg",
    jetphotosUrl: "https://www.jetphotos.com/photo/keyword/A300-214",
    variant: "A300-214",
    variantInfo: "The Airbus A300-214 is a variant of the A300 wide-body twin-engine airliner. The A300 was the first twin-engine wide-body aircraft and pioneered many technologies later used in other Airbus aircraft. The -214 variant features specific engine and configuration options, making it suitable for medium to long-haul routes. The A300's innovative design and fuel efficiency made it popular with airlines worldwide.",
    baseModel: "Airbus A300",
    firstFlight: "1972",
    description: "Airbus A300-214, a wide-body twin-engine airliner. The A300 was the first twin-engine wide-body aircraft and pioneered many modern aviation technologies.",
    length: "54.08 m (177 ft 5 in)",
    wingspan: "44.84 m (147 ft 1 in)",
    height: "16.53 m (54 ft 3 in)",
    maxSpeed: "Mach 0.86 (913 km/h)",
    range: "7,500 km (4,660 mi)",
    capacity: "266-345 passengers"
  }
};

// Helper function to find aircraft data (handles variations in model names)
function getAircraftData(modelName) {
  // Try exact match first
  if (aircraftDatabase[modelName]) {
    return aircraftDatabase[modelName];
  }
  
  // Try to match common variations
  const normalized = modelName.toUpperCase();
  for (const [key, value] of Object.entries(aircraftDatabase)) {
    if (normalized.includes(key.toUpperCase()) || key.toUpperCase().includes(normalized)) {
      return value;
    }
  }
  
  // Try partial matches for common patterns
  if (normalized.includes("737") && normalized.includes("7H4")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["737-7H4"]) {
      return aircraftDatabase["737-7H4"];
    }
    return aircraftDatabase["737 7H4"];
  }
  if (normalized.includes("737") && normalized.includes("823")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["737-823"]) {
      return aircraftDatabase["737-823"];
    }
    return aircraftDatabase["737 823"];
  }
  if (normalized.includes("737") && normalized.includes("8AS")) {
    // Try hyphenated version first
    if (aircraftDatabase["737-8AS"]) {
      return aircraftDatabase["737-8AS"];
    }
  }
  if (normalized.includes("737") && (normalized.includes("800") || normalized.includes("8"))) {
    return aircraftDatabase["737-800"];
  }
  if (normalized.includes("A319")) {
    return aircraftDatabase["A319"];
  }
  if (normalized.includes("A320") && normalized.includes("214SL")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["A320-214SL"]) {
      return aircraftDatabase["A320-214SL"];
    }
    return aircraftDatabase["A320 214SL"];
  }
  if (normalized.includes("A320") && normalized.includes("214")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["A320-214"]) {
      return aircraftDatabase["A320-214"];
    }
    return aircraftDatabase["A320 214"];
  }
  if (normalized.includes("A320") && normalized.includes("231")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["A320-231"]) {
      return aircraftDatabase["A320-231"];
    }
    return aircraftDatabase["A320 231"];
  }
  if (normalized.includes("A320") && normalized.includes("232")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["A320-232"]) {
      return aircraftDatabase["A320-232"];
    }
    return aircraftDatabase["A320 232"];
  }
  if (normalized.includes("A320") && !normalized.includes("A321") && !normalized.includes("A319")) {
    return aircraftDatabase["A320"];
  }
  if (normalized.includes("A321") && normalized.includes("231")) {
    // Try hyphenated version first, then space version
    if (aircraftDatabase["A321-231"]) {
      return aircraftDatabase["A321-231"];
    }
    return aircraftDatabase["A321 231"];
  }
  if (normalized.includes("A321")) {
    return aircraftDatabase["A321"];
  }
  if (normalized.includes("787")) {
    return aircraftDatabase["787-8"];
  }
  if (normalized.includes("CRJ") || normalized.includes("CL-600")) {
    if (normalized.includes("900") || normalized.includes("2D24")) {
      return aircraftDatabase["CRJ-900"];
    }
    if (normalized.includes("700") || normalized.includes("2C10")) {
      if (aircraftDatabase["CL-600-2C10"]) {
        return aircraftDatabase["CL-600-2C10"];
      }
      return {
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bombardier_CRJ900%2C_United_Express_AN1857502.jpg/800px-Bombardier_CRJ900%2C_United_Express_AN1857502.jpg",
        jetphotosUrl: "https://www.jetphotos.com/photo/keyword/CRJ-700",
        variant: "CRJ-700",
        variantInfo: "The Bombardier CRJ-700 is a regional jet designed for short to medium-haul routes. It offers improved fuel efficiency and passenger comfort compared to earlier CRJ models.",
        baseModel: "Bombardier CRJ Series",
        firstFlight: "1999",
        description: "Bombardier CRJ-700, a regional jet designed for short to medium-haul routes.",
        length: "32.51 m (106 ft 8 in)",
        wingspan: "23.24 m (76 ft 3 in)",
        height: "7.57 m (24 ft 10 in)",
        maxSpeed: "Mach 0.83 (882 km/h)",
        range: "3,650 km (2,268 mi)",
        capacity: "68-70 passengers"
      };
    }
    return aircraftDatabase["CRJ-900"]; // Default to CRJ-900 for other CRJ variants
  }
  if (normalized.includes("ERJ") && normalized.includes("170") && (normalized.includes("200") || normalized.includes("LR"))) {
    return aircraftDatabase["ERJ 170-200 LR"];
  }
  if (normalized.includes("ERJ") && normalized.includes("190")) {
    return aircraftDatabase["ERJ-190"];
  }
  if (normalized.includes("777")) {
    return aircraftDatabase["777-300ER"];
  }
  if (normalized.includes("A330")) {
    return aircraftDatabase["A330"];
  }
  if (normalized.includes("A350")) {
    return aircraftDatabase["A350"];
  }
  if (normalized.includes("A300")) {
    if (normalized.includes("214")) {
      // Try hyphenated version first, then space version
      if (aircraftDatabase["A300-214"]) {
        return aircraftDatabase["A300-214"];
      }
      return aircraftDatabase["A300 214"];
    }
    return aircraftDatabase["A300 214"]; // Default to A300-214 for other A300 variants
  }
  
  // Estimate specifications based on model type
  const modelUpper = modelName.toUpperCase();
  let estimatedSpecs = {
    length: "~35 m (~115 ft)",
    wingspan: "~30 m (~98 ft)",
    height: "~11 m (~36 ft)",
    maxSpeed: "Mach 0.82 (~870 km/h)",
    range: "~5,000 km (~3,100 mi)",
    capacity: "~150 passengers"
  };
  
  // Estimate based on aircraft family
  if (modelUpper.includes("737")) {
    estimatedSpecs = {
      length: "39.5 m (129 ft 7 in)",
      wingspan: "35.8 m (117 ft 5 in)",
      height: "12.5 m (41 ft 2 in)",
      maxSpeed: "Mach 0.82 (876 km/h)",
      range: "5,765 km (3,582 mi)",
      capacity: "162-189 passengers"
    };
  } else if (normalized.includes("A319") || (normalized.includes("A320") && !normalized.includes("A321"))) {
    estimatedSpecs = {
      length: modelUpper.includes("A319") ? "33.84 m (111 ft 0 in)" : "37.57 m (123 ft 3 in)",
      wingspan: "34.10 m (111 ft 10 in)",
      height: "11.76 m (38 ft 7 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: modelUpper.includes("A319") ? "6,850 km (4,257 mi)" : "6,150 km (3,822 mi)",
      capacity: modelUpper.includes("A319") ? "124-156 passengers" : "150-180 passengers"
    };
  } else if (modelUpper.includes("A321")) {
    estimatedSpecs = {
      length: "44.51 m (146 ft 0 in)",
      wingspan: "34.10 m (111 ft 10 in)",
      height: "11.76 m (38 ft 7 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: "5,950 km (3,698 mi)",
      capacity: "185-236 passengers"
    };
  } else if (modelUpper.includes("787")) {
    estimatedSpecs = {
      length: "57 m (186 ft 11 in)",
      wingspan: "60.12 m (197 ft 3 in)",
      height: "16.92 m (55 ft 6 in)",
      maxSpeed: "Mach 0.85 (903 km/h)",
      range: "13,620 km (8,465 mi)",
      capacity: "242 passengers"
    };
  } else if (modelUpper.includes("777")) {
    estimatedSpecs = {
      length: modelUpper.includes("300") ? "73.9 m (242 ft 4 in)" : "63.7 m (209 ft 1 in)",
      wingspan: "64.8 m (212 ft 7 in)",
      height: "18.5 m (60 ft 8 in)",
      maxSpeed: "Mach 0.84 (893 km/h)",
      range: modelUpper.includes("300") ? "14,685 km (9,125 mi)" : "9,695 km (6,025 mi)",
      capacity: modelUpper.includes("300") ? "365-550 passengers" : "314-396 passengers"
    };
  } else if (modelUpper.includes("A330")) {
    estimatedSpecs = {
      length: "58.82 m (193 ft 0 in)",
      wingspan: "60.3 m (197 ft 10 in)",
      height: "17.39 m (57 ft 1 in)",
      maxSpeed: "Mach 0.86 (913 km/h)",
      range: "13,450 km (8,355 mi)",
      capacity: "250-440 passengers"
    };
  } else if (modelUpper.includes("A350")) {
    estimatedSpecs = {
      length: "66.8 m (219 ft 2 in)",
      wingspan: "64.75 m (212 ft 5 in)",
      height: "17.05 m (55 ft 11 in)",
      maxSpeed: "Mach 0.89 (945 km/h)",
      range: "15,000 km (9,321 mi)",
      capacity: "325-410 passengers"
    };
  } else if (modelUpper.includes("CRJ") || modelUpper.includes("CL-600")) {
    if (modelUpper.includes("900") || modelUpper.includes("2D24")) {
      estimatedSpecs = {
        length: "36.4 m (119 ft 5 in)",
        wingspan: "24.85 m (81 ft 6 in)",
        height: "7.51 m (24 ft 8 in)",
        maxSpeed: "Mach 0.83 (882 km/h)",
        range: "3,417 km (2,123 mi)",
        capacity: "76-90 passengers"
      };
    } else if (modelUpper.includes("700") || modelUpper.includes("2C10")) {
      estimatedSpecs = {
        length: "32.5 m (106 ft 8 in)",
        wingspan: "23.2 m (76 ft 1 in)",
        height: "7.6 m (24 ft 11 in)",
        maxSpeed: "Mach 0.83 (882 km/h)",
        range: "3,650 km (2,268 mi)",
        capacity: "68-70 passengers"
      };
    } else {
      estimatedSpecs = {
        length: "26.8 m (87 ft 10 in)",
        wingspan: "21.2 m (69 ft 7 in)",
        height: "6.2 m (20 ft 4 in)",
        maxSpeed: "Mach 0.81 (860 km/h)",
        range: "3,046 km (1,893 mi)",
        capacity: "50 passengers"
      };
    }
  } else if (modelUpper.includes("ERJ") && modelUpper.includes("190")) {
    estimatedSpecs = {
      length: "36.24 m (118 ft 11 in)",
      wingspan: "28.72 m (94 ft 3 in)",
      height: "10.28 m (33 ft 9 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: "4,260 km (2,648 mi)",
      capacity: "98-114 passengers"
    };
  } else if (modelUpper.includes("ERJ") && modelUpper.includes("170")) {
    estimatedSpecs = {
      length: "29.9 m (98 ft 1 in)",
      wingspan: "26.0 m (85 ft 4 in)",
      height: "9.7 m (31 ft 10 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: "3,889 km (2,417 mi)",
      capacity: "70-80 passengers"
    };
  } else if (modelUpper.includes("ERJ") && modelUpper.includes("175")) {
    estimatedSpecs = {
      length: "31.7 m (104 ft 0 in)",
      wingspan: "26.0 m (85 ft 4 in)",
      height: "9.7 m (31 ft 10 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: "3,704 km (2,302 mi)",
      capacity: "76-88 passengers"
    };
  } else if (modelUpper.includes("737")) {
    // Generic 737 variants
    estimatedSpecs = {
      length: "39.5 m (129 ft 7 in)",
      wingspan: "35.8 m (117 ft 5 in)",
      height: "12.5 m (41 ft 2 in)",
      maxSpeed: "Mach 0.82 (876 km/h)",
      range: "5,765 km (3,582 mi)",
      capacity: "162-189 passengers"
    };
  } else if (modelUpper.includes("A320") || modelUpper.includes("A321")) {
    // Generic A320/A321 variants
    estimatedSpecs = {
      length: modelUpper.includes("A321") ? "44.51 m (146 ft 0 in)" : "37.57 m (123 ft 3 in)",
      wingspan: "34.10 m (111 ft 10 in)",
      height: "11.76 m (38 ft 7 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: modelUpper.includes("A321") ? "5,950 km (3,698 mi)" : "6,150 km (3,822 mi)",
      capacity: modelUpper.includes("A321") ? "185-236 passengers" : "150-180 passengers"
    };
  } else if (modelUpper.includes("A319")) {
    // Generic A319 variants
    estimatedSpecs = {
      length: "33.84 m (111 ft 0 in)",
      wingspan: "34.10 m (111 ft 10 in)",
      height: "11.76 m (38 ft 7 in)",
      maxSpeed: "Mach 0.82 (871 km/h)",
      range: "6,850 km (4,257 mi)",
      capacity: "124-156 passengers"
    };
  } else if (modelUpper.includes("A330")) {
    // Generic A330 variants
    estimatedSpecs = {
      length: "58.82 m (193 ft 0 in)",
      wingspan: "60.3 m (197 ft 10 in)",
      height: "17.39 m (57 ft 1 in)",
      maxSpeed: "Mach 0.86 (913 km/h)",
      range: "13,450 km (8,355 mi)",
      capacity: "250-440 passengers"
    };
  } else if (modelUpper.includes("787")) {
    // Generic 787 variants
    estimatedSpecs = {
      length: "57 m (186 ft 11 in)",
      wingspan: "60.12 m (197 ft 3 in)",
      height: "16.92 m (55 ft 6 in)",
      maxSpeed: "Mach 0.85 (903 km/h)",
      range: "13,620 km (8,465 mi)",
      capacity: "242 passengers"
    };
  } else if (modelUpper.includes("777")) {
    // Generic 777 variants
    estimatedSpecs = {
      length: "73.9 m (242 ft 4 in)",
      wingspan: "64.8 m (212 ft 7 in)",
      height: "18.5 m (60 ft 8 in)",
      maxSpeed: "Mach 0.84 (893 km/h)",
      range: "14,685 km (9,125 mi)",
      capacity: "365-550 passengers"
    };
  } else if (modelUpper.includes("CRJ") || modelUpper.includes("CL-600")) {
    // Generic CRJ variants
    estimatedSpecs = {
      length: "36.4 m (119 ft 5 in)",
      wingspan: "24.85 m (81 ft 6 in)",
      height: "7.51 m (24 ft 8 in)",
      maxSpeed: "Mach 0.83 (882 km/h)",
      range: "3,417 km (2,123 mi)",
      capacity: "76-90 passengers"
    };
  } else if (modelUpper.includes("A300") || modelUpper.includes("A310")) {
    // Generic A300/A310 variants
    estimatedSpecs = {
      length: "54.08 m (177 ft 5 in)",
      wingspan: "44.84 m (147 ft 1 in)",
      height: "16.53 m (54 ft 3 in)",
      maxSpeed: "Mach 0.86 (913 km/h)",
      range: "7,500 km (4,660 mi)",
      capacity: "266-345 passengers"
    };
  } else {
    // Generic estimates for unknown commercial aircraft
    estimatedSpecs = {
      length: "~35 m (~115 ft)",
      wingspan: "~30 m (~98 ft)",
      height: "~11 m (~36 ft)",
      maxSpeed: "Mach 0.82 (~870 km/h)",
      range: "~5,000 km (~3,100 mi)",
      capacity: "~150 passengers"
    };
  }
  
  // Generate appropriate description and variantInfo based on aircraft type
  let description = "A commercial airliner serving routes worldwide. Specifications vary by model variant.";
  let variantInfo = "A commercial airliner serving routes worldwide. Variant specifications and configurations may vary by airline and operational requirements.";
  let baseModel = "Commercial Airliner";
  
  if (modelUpper.includes("737")) {
    baseModel = "Boeing 737 Next Generation";
    description = `Boeing ${modelName}, a variant of the 737 Next Generation family. Known for its reliability and fuel efficiency, it's a workhorse of short to medium-haul routes.`;
    variantInfo = `The Boeing ${modelName} is a variant of the 737 Next Generation family. This variant features improved fuel efficiency, extended range, and increased passenger capacity compared to earlier 737 models. The specific designation indicates airline-specific configurations and engine options optimized for various operational requirements.`;
  } else if (modelUpper.includes("A320")) {
    baseModel = "Airbus A320 Family";
    description = `Airbus ${modelName}, a variant of the A320 family. Features advanced fly-by-wire technology and fuel efficiency, making it a direct competitor to the Boeing 737.`;
    variantInfo = `The Airbus ${modelName} is a variant of the A320 family, which revolutionized single-aisle aircraft with its fly-by-wire technology. This variant maintains the A320's advanced flight control systems, spacious cabin, and fuel efficiency while offering specific performance characteristics suited to different route profiles.`;
  } else if (modelUpper.includes("A321")) {
    baseModel = "Airbus A320 Family";
    description = `Airbus ${modelName}, a variant of the A321 family. The largest member of the A320 family, offering increased capacity while maintaining efficiency.`;
    variantInfo = `The Airbus ${modelName} is a variant of the A321 family, which is the stretched variant of the A320 family. This variant offers the highest passenger capacity while maintaining the same cockpit and systems. Its extended fuselage allows airlines to serve high-density routes efficiently.`;
  } else if (modelUpper.includes("A319")) {
    baseModel = "Airbus A320 Family";
    description = `Airbus ${modelName}, a variant of the A319 family. The smallest member of the A320 family, ideal for regional routes and shorter runways.`;
    variantInfo = `The Airbus ${modelName} is a variant of the A319 family, which is the smallest member of the A320 family. Designed for shorter routes and smaller airports, its compact size allows it to operate from runways as short as 1,800 meters, making it ideal for regional routes and challenging airports.`;
  } else if (modelUpper.includes("A330")) {
    baseModel = "Airbus A330 Family";
    description = `Airbus ${modelName}, a variant of the A330 family. A wide-body twin-engine airliner known for its long-range capabilities and fuel efficiency.`;
    variantInfo = `The Airbus ${modelName} is a variant of the A330 family, which has become one of the most successful wide-body aircraft in history. It offers exceptional range and fuel efficiency for both medium and long-haul routes, making it a workhorse for international operations.`;
  } else if (modelUpper.includes("787")) {
    baseModel = "Boeing 787 Dreamliner";
    description = `Boeing ${modelName}, a variant of the 787 Dreamliner family. A revolutionary wide-body aircraft made primarily of composite materials with exceptional fuel efficiency.`;
    variantInfo = `The Boeing ${modelName} is a variant of the 787 Dreamliner family, which revolutionized long-haul travel with its composite construction and advanced systems. Over 50% of the aircraft is made from composite materials, reducing weight and improving fuel efficiency by up to 20% compared to similar-sized aircraft.`;
  } else if (modelUpper.includes("777")) {
    baseModel = "Boeing 777";
    description = `Boeing ${modelName}, a variant of the 777 family. One of the world's most successful wide-body aircraft, known for its reliability and long-range capabilities.`;
    variantInfo = `The Boeing ${modelName} is a variant of the 777 family, one of the most successful wide-body aircraft ever built. This variant features exceptional reliability and range, making it the preferred choice for many airlines' longest routes.`;
  } else if (modelUpper.includes("CRJ") || modelUpper.includes("CL-600")) {
    baseModel = "Bombardier CRJ Series";
    description = `Bombardier ${modelName}, a regional jet variant designed for short to medium-haul routes. Features improved fuel efficiency and passenger comfort.`;
    variantInfo = `The Bombardier ${modelName} is a variant of the CRJ (Canadair Regional Jet) family. This regional jet bridges the gap between smaller regional aircraft and mainline narrow-body jets, offering mainline-style amenities in a regional aircraft.`;
  } else if (modelUpper.includes("ERJ")) {
    baseModel = "Embraer E-Jet Family";
    description = `Embraer ${modelName}, a modern regional jet offering mainline comfort in a smaller aircraft. Popular for connecting smaller cities to major hubs.`;
    variantInfo = `The Embraer ${modelName} is part of Embraer's E-Jet family, designed to compete directly with smaller narrow-body aircraft. Unlike traditional regional jets, it features a wider cabin with a 2+2 seating configuration, providing mainline comfort in a smaller aircraft.`;
  } else if (modelUpper.includes("A300") || modelUpper.includes("A310")) {
    baseModel = "Airbus A300";
    description = `Airbus ${modelName}, a wide-body twin-engine airliner. The A300 was the first twin-engine wide-body aircraft and pioneered many modern aviation technologies.`;
    variantInfo = `The Airbus ${modelName} is a variant of the A300 family, which was the first twin-engine wide-body aircraft and pioneered many technologies later used in other Airbus aircraft. Its innovative design and fuel efficiency made it popular with airlines worldwide.`;
  }
  
  return {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg/800px-Boeing_737-800_%28B738%29%2C_Southwest_Airlines_%28N8609F%29_AN1922509.jpg",
    jetphotosUrl: `https://www.jetphotos.com/photo/keyword/${encodeURIComponent(modelName)}`,
    variant: modelName,
    variantInfo: variantInfo,
    baseModel: baseModel,
    firstFlight: "",
    description: description,
    ...estimatedSpecs
  };
}

// Plane card for model name hover
let planeCard = null;

function showPlaneCard(event, d, dateInfo, modelInfoLookup) {
  // Remove existing card if it exists
  if (planeCard) {
    planeCard.remove();
  }
  
  // Create new card
  planeCard = d3.select("body").append("div")
    .attr("class", "plane-card")
    .style("position", "fixed")
    .style("background", "#ffffff")
    .style("color", "#000000")
    .style("padding", "0")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "auto")
    .style("z-index", "99999")
    .style("box-shadow", "0 8px 24px rgba(0,0,0,0.3)")
    .style("border", "2px solid #000000")
    .style("opacity", "1")
    .style("display", "block")
    .style("visibility", "visible")
      .style("width", "280px")
      .style("max-height", "60vh")
    .style("overflow-y", "auto")
    .style("overflow-x", "hidden")
    .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif");

  const modelInfo = modelInfoLookup.get(d.model) || {
    model: d.model,
    manufacturer: "Unknown",
    typecode: "",
    operator: "",
    engines: "",
    built: ""
  };

  const aircraftData = getAircraftData(d.model);

  const cardContent = `
    <div style="width: 100%; background: #f8fafc; padding: 10px 12px; border-bottom: 2px solid #cbd5e1;">
      <div style="font-weight: 700; font-size: 15px; color: #000000; margin-bottom: 3px; line-height: 1.2;">
        ${d.model}
      </div>
      <div style="font-size: 10px; color: #334155; font-weight: 500;">
        <strong style="color: #000000;">${modelInfo.manufacturer}</strong>
      </div>
    </div>
    
    <div style="padding: 10px 12px;">
      <div style="margin-bottom: 10px; border-radius: 5px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1); position: relative; background: #f8fafc;">
        <img src="${aircraftData.image}" 
             alt="${d.model}" 
             style="width: 100%; height: auto; display: block; max-height: 120px; min-height: 100px; object-fit: cover; background: linear-gradient(135deg, #e2e8f0, #cbd5e1);"
             onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display: none; padding: 30px 12px; text-align: center; color: #1e293b; background: linear-gradient(135deg, #f1f5f9, #e2e8f0);">
          <div style="font-size: 32px; margin-bottom: 4px;">✈️</div>
          <div style="font-size: 12px; font-weight: 700; color: #000000;">${d.model}</div>
        </div>
      </div>
      
      ${aircraftData.variantInfo ? `
        <div style="margin-bottom: 10px; padding: 8px; background: #eff6ff; border-left: 3px solid #2563eb; border-radius: 4px;">
          <div style="font-size: 10px; color: #1e293b; line-height: 1.4; font-weight: 400;">
            ${aircraftData.variantInfo.substring(0, 150)}${aircraftData.variantInfo.length > 150 ? '...' : ''}
          </div>
        </div>
      ` : ''}
      
      <div style="border-top: 1px solid #cbd5e1; padding-top: 10px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 6px;">
          <tr>
            <td style="padding: 6px 8px; background: #f1f5f9; border-radius: 4px; width: 50%; border: 1px solid #cbd5e1;">
              <div style="font-size: 8px; color: #475569; margin-bottom: 2px; font-weight: 600; text-transform: uppercase;">Length</div>
              <div style="font-size: 10px; font-weight: 700; color: #000000;">${aircraftData.length}</div>
            </td>
            <td style="padding: 6px 8px; padding-left: 6px; background: #f1f5f9; border-radius: 4px; border: 1px solid #cbd5e1;">
              <div style="font-size: 8px; color: #475569; margin-bottom: 2px; font-weight: 600; text-transform: uppercase;">Wingspan</div>
              <div style="font-size: 10px; font-weight: 700; color: #000000;">${aircraftData.wingspan}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; background: #f1f5f9; border-radius: 4px; border: 1px solid #cbd5e1;" colspan="2">
              <div style="font-size: 8px; color: #475569; margin-bottom: 2px; font-weight: 600; text-transform: uppercase;">Capacity</div>
              <div style="font-size: 10px; font-weight: 700; color: #000000;">${aircraftData.capacity}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // Calculate position to keep card on screen
  const cardWidth = 280;
  const cardHeight = 400; // approximate max height
  const padding = 10;
  
  let leftPos = event.pageX + padding;
  let topPos = event.pageY - 10;
  
  // Adjust if card would go off right edge
  if (leftPos + cardWidth > window.innerWidth - padding) {
    leftPos = event.pageX - cardWidth - padding;
  }
  
  // Adjust if card would go off bottom edge
  if (topPos + cardHeight > window.innerHeight - padding) {
    topPos = window.innerHeight - cardHeight - padding;
  }
  
  // Ensure card doesn't go off top or left
  if (topPos < padding) topPos = padding;
  if (leftPos < padding) leftPos = padding;
  
  planeCard
    .html(cardContent)
    .style("left", leftPos + "px")
    .style("top", topPos + "px")
    .style("opacity", "1")
    .style("display", "block")
    .style("visibility", "visible");
}

function hidePlaneCard() {
  if (planeCard) {
    planeCard
      .style("opacity", "0")
      .style("visibility", "hidden")
      .style("display", "none");
  }
}
