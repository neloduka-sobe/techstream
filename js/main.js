
const App = {
  data: null,
  rendered: new Set(),
  sections: [],
  index: 0,
  registry: {
    "vis-fuel-gauge": renderFuelGauge,
    "vis-calendar": renderCalendar,
    "vis-timeline-map": renderFuelGauge,
    "vis-podium-aircraft": renderPodium,
    "vis-globe-links": renderGlobeLinks,
  },
  milestones: {
    // section indices for: Intro, Emissions, Total Flights, Aircraft, Globe, Conclusion
    // NOTE: we’ll fix the last one to point to the conclusion after sections are known
    indices: [0, 2, 4, 6, 8, null],
    labels: ["Intro", "Emissions", "Flights", "Aircraft", "Globe", "Conclusion"]
  }
};

/** Try to load CSV; on failure return a tiny mock dataset */
async function loadData() {
  try {
    const res = await fetch("data/flights_clean.csv", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return d3.csvParse(text, d3.autoType);
  } catch (err) {
    console.warn("[Data] Load failed; using fallback dataset.", err);
    return [
      { country: "Canada", value: 50, period: "Before" },
      { country: "USA", value: 70, period: "After" }
    ];
  }
}

/** Show a small status toast at bottom (used when on fallback) */
function showStatusNote(msg) {
  let note = document.getElementById("status-note");
  if (!note) {
    note = document.createElement("div");
    note.id = "status-note";
    note.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);bottom:64px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px 12px;color:#0f172a;box-shadow:0 6px 18px rgba(0,0,0,0.08);z-index:99999;font:12px/1.4 system-ui";
    document.body.appendChild(note);
  }
  note.textContent = msg;
}

/** Draw a friendly fallback label inside a visualization panel */
function renderFallbackMessage(canvasEl, msg = "No data available") {
  const el = d3.select(canvasEl);
  el.selectAll("*").remove();
  const W = canvasEl.clientWidth || 960;
  const H = canvasEl.clientHeight || 600;
  const svg = el.append("svg").attr("viewBox", [0, 0, W, H]);
  svg
    .append("text")
    .attr("x", W / 2)
    .attr("y", H / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7280")
    .attr("font-size", 16)
    .text(msg);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Load real data or fallback safely
  App.data = await loadData();
  const usingFallback = !Array.isArray(App.data) || App.data.length < 3;

  const scroller = document.getElementById("scroller");
  App.sections = Array.from(scroller.querySelectorAll(".hsnap-child"));
  App.milestones.indices[App.milestones.indices.length - 1] = App.sections.length - 1
  buildTimeline();

  // Ensure layout is settled, then start indicator at Intro
  requestAnimationFrame(() => updateTimeline(0));

  // Horizontal paging (wheel + keys)
  let lock = false;
  const PAGE_DELAY = 1100; // ms
  function snapTo(i) {
    i = Math.max(0, Math.min(App.sections.length - 1, i));
    App.index = i;
    App.sections[i].scrollIntoView({ behavior: "smooth", inline: "start" });
    updateTimeline(); // reflect immediately
    updateArrows();
  }
  const leftArrow = document.getElementById("nav-left");
  const rightArrow = document.getElementById("nav-right");

  function updateArrows() {
    if (!leftArrow || !rightArrow) return;
    // hide left arrow on first section
    if (App.index <= 0) {
      leftArrow.classList.add("nav-arrow--hidden");
    } else {
      leftArrow.classList.remove("nav-arrow--hidden");
    }
    // hide right arrow on last section
    if (App.index >= App.sections.length - 1) {
      rightArrow.classList.add("nav-arrow--hidden");
    } else {
      rightArrow.classList.remove("nav-arrow--hidden");
    }
  }

  if (leftArrow && rightArrow) {
    leftArrow.addEventListener("click", () => snapTo(App.index - 1));
    rightArrow.addEventListener("click", () => snapTo(App.index + 1));
  }

  // initial arrow state
  updateArrows();

  scroller.addEventListener(
    "wheel",
    (e) => {
      // 1) Never page if the event starts over a visualization
      if (e.target.closest(".vis-canvas")) {
        return;
      }

      const { deltaX, deltaY } = e;

      // 2) Only treat this as paging if it's primarily horizontal
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        // vertical-ish scrolling → ignore for paging
        return;
      }

      if (lock) return;
      lock = true;

      if (deltaX > 0) {
        snapTo(App.index + 1);
      } else if (deltaX < 0) {
        snapTo(App.index - 1);
      }

      setTimeout(() => (lock = false), PAGE_DELAY);
    },
    { passive: true }
  );


  // Prevent the outer scroller AND browser from moving when zooming inside a visualization
  document.querySelectorAll(".vis-canvas").forEach((canvas) => {
    canvas.addEventListener(
      "wheel",
      (e) => {
        // Let D3 zoom on the inner <svg> handle this, but:
        e.stopPropagation();   // do NOT bubble to #scroller
        e.preventDefault();    // do NOT scroll the page / container
      },
      { passive: false }        // MUST be false or preventDefault() is ignored
    );
  });


  window.addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", "Space"].includes(e.key)) {
      e.preventDefault();
      snapTo(App.index + 1);
    }
    if (["ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      snapTo(App.index - 1);
    }
  });

  // Render each section once via IntersectionObserver
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        const canvas = entry.target.querySelector(".vis-canvas");
        if (!canvas) return;

        const id = canvas.id;
        if (App.rendered.has(id)) return;

        try {
          if (!App.data || !App.data.length) {
            // No data → draw fallback message in this panel
            renderFallbackMessage(canvas, "No data available (using placeholder).");
          } else if (App.registry[id]) {
            // Normal render
            App.registry[id]("#" + id, App.data);
          } else {
            // Unknown viz id → show a generic message
            renderFallbackMessage(canvas, "Visualization not registered.");
          }
        } catch (err) {
          console.error(`[Render] ${id} failed:`, err);
          renderFallbackMessage(canvas, "Render error — see console.");
        } finally {
          App.rendered.add(id);
        }
      });
    },
    { threshold: 0.6, root: scroller }
  );

  scroller.querySelectorAll(".panel").forEach((sec) => io.observe(sec));

  // Keep plane aligned during manual scrolls and resizes
  scroller.addEventListener("scroll", () => {
    const left = scroller.scrollLeft;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const p = max > 0 ? left / max : 0;
    updateTimeline(p);

    // Track nearest section for paging logic
    let best = 0,
      bestDist = Infinity;
    App.sections.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft - left);
      if (d < bestDist) {
        best = i;
        bestDist = d;
      }
    });
    App.index = best;
    updateArrows();
  });

  window.addEventListener("resize", () => {
    updateTimeline(); // keep plane on track
    snapTo(App.index); // re-snap to current section to keep it centered
  });

  /** Build ticks + labels for the bottom progress line (based on milestones) */
  function buildTimeline() {
    const { indices, labels } = App.milestones;

    const ticksEl = document.getElementById("ticks");
    const labelsEl = document.getElementById("labels");
    ticksEl.innerHTML = "";
    labelsEl.innerHTML = "";

    const count = labels.length - 1; // normalize 0..1 along track

    labels.forEach((label, i) => {
      const pct = count === 0 ? 0 : i / count;

      const tick = document.createElement("div");
      tick.className = "tick" + (i === 0 ? " active" : "");
      tick.style.left = pct * 100 + "%";
      tick.title = label;

      // remember which section index this tick corresponds to
      tick.dataset.sectionIndex = indices[i];

      ticksEl.appendChild(tick);
    });

    labelsEl.innerHTML = labels.map((l) => `<span>${l}</span>`).join("");
  }


  /** Move plane + activate ticks (snaps on milestones, free between) */
  function updateTimeline(progress) {
    const plane = document.getElementById("plane");
    const ticks = Array.from(document.querySelectorAll(".tick"));
    const scroller = document.getElementById("scroller");
    const { indices } = App.milestones;

    // 1) Base progress from scroll, 0..1
    let p = progress;
    if (p == null) {
      const left = scroller.scrollLeft;
      const max = scroller.scrollWidth - scroller.clientWidth;
      p = max > 0 ? left / max : 0;
    }
    p = Math.max(0, Math.min(1, p));

    const current = App.index; // nearest snapped section index

    // 2) Find nearest milestone to the current section
    let nearestMilestoneIdx = 0;
    let bestDist = Infinity;
    indices.forEach((secIdx, i) => {
      const d = Math.abs(secIdx - current);
      if (d < bestDist) {
        bestDist = d;
        nearestMilestoneIdx = i;
      }
    });

    const onMilestone = indices.includes(current);

    // 3) Decide where the plane should be:
    //    - If current section *is* a milestone, snap plane to that tick
    //    - Otherwise, let plane move by raw scroll (so it can sit between stops)
    if (onMilestone) {
      const steps = indices.length - 1;
      const pct = steps === 0 ? 0 : nearestMilestoneIdx / steps;
      plane.style.left = pct * 100 + "%";
    } else {
      plane.style.left = p * 100 + "%";
    }

    // 4) Activate ticks up to the nearest milestone
    ticks.forEach((t, i) => {
      t.classList.toggle("active", i <= nearestMilestoneIdx);
    });
  }

});
