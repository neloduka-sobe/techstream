
const App = {
  data: null,
  rendered: new Set(),
  sections: [],
  index: 0,
  registry: {
    "vis-globe-links": renderGlobeLinks,
    "vis-calendar": renderCalendar,
    "vis-timeline-map": renderTimelineMap,
    "vis-podium-aircraft": renderPodium,
    "vis-plane-view": renderPlaneView
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
  }

  scroller.addEventListener(
    "wheel",
    (e) => {
      if (lock) return;
      lock = true;
      const delta = e.deltaY || e.deltaX;
      if (delta > 0) snapTo(App.index + 1);
      else if (delta < 0) snapTo(App.index - 1);
      setTimeout(() => (lock = false), PAGE_DELAY);
    },
    { passive: true }
  );

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
  });

  window.addEventListener("resize", () => updateTimeline()); // keep plane on track

  /** Build ticks + labels for the bottom progress line */
  function buildTimeline() {
    const labels = ["Intro", "Global", "Calendar", "Timeline", "Podium", "Plane"];
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
      ticksEl.appendChild(tick);
    });
    labelsEl.innerHTML = labels.map((l) => `<span>${l}</span>`).join("");
  }

  /** Move plane + activate ticks */
  function updateTimeline(progress) {
    const plane = document.getElementById("plane");
    const ticks = Array.from(document.querySelectorAll(".tick"));

    // derive progress if not provided
    let p = progress;
    if (p == null) {
      const left = scroller.scrollLeft;
      const max = scroller.scrollWidth - scroller.clientWidth;
      p = max > 0 ? left / max : 0;
    }
    p = Math.max(0, Math.min(1, p));

    // Move plane by left:% so it aligns with the track regardless of viewport
    plane.style.left = p * 100 + "%";

    // Activate ticks up to nearest section
    const activeIdx = Math.round(p * (App.sections.length - 1));
    ticks.forEach((t, i) => t.classList.toggle("active", i <= activeIdx));
  }
});
