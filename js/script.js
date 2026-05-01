// Web split: RUN (compile animation) / RESET
function toggleWebView(btn) {
  const split = btn.closest(".web-split");
  if (!split) return;

  if (split.classList.contains("executed")) {
    // RESET
    split.classList.remove("executed");
    const bar = split.querySelector(".compile-bar");
    if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; }
    btn.innerHTML = '<span class="web-run-icon">▶</span> RUN';
    return;
  }

  if (split.classList.contains("compiling")) return;

  // COMPILE → flash → execute
  split.classList.add("compiling");
  btn.innerHTML = '<span style="font-size:0.85em;opacity:0.65">⏳</span> COMPILING...';
  btn.disabled = true;

  setTimeout(() => {
    split.classList.remove("compiling");
    split.classList.add("executed");
    btn.innerHTML = '<span class="web-run-icon">■</span> RESET';
    btn.disabled = false;
  }, 650);
}

// Fullscreen modal
function openFullscreen(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const modal = document.getElementById("fsModal");
  const body  = document.getElementById("fsModalBody");
  body.innerHTML = card.innerHTML;
  // Mark IDE lines as revealed in modal (typewriter already ran)
  body.querySelectorAll(".ide-line").forEach(l => l.classList.add("revealed"));
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeFullscreen() {
  document.getElementById("fsModal").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeFullscreen();
});

function toggleMenu() {
  const menu    = document.getElementById("mobile-menu");
  const icon    = document.getElementById("ham-icon");
  const isOpen  = menu.classList.toggle("open");
  if (icon) icon.textContent = isOpen ? "✕" : "≡";
}

function toggleTheme() {
  const body = document.getElementById("body");
  const btnText = document.getElementById("theme-text");
  const isDark = body.classList.contains("dark-theme");

  if (isDark) {
    body.classList.replace("dark-theme", "light-theme");
    btnText.textContent = "DARK MODE";
  } else {
    body.classList.replace("light-theme", "dark-theme");
    btnText.textContent = "LIGHT MODE";
  }
}

window.addEventListener("scroll", () => {
  document.getElementById("backToTop").classList.toggle("show", window.scrollY > 300);
});

// Scroll-triggered fade-in for [data-animate] elements
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || "0s";
        entry.target.style.animationDelay = delay;
        entry.target.classList.add("fade-in");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-animate]").forEach((el) => fadeObserver.observe(el));

  // Progress rings: animate stroke-dashoffset when scrolled into view
  const rings = document.querySelectorAll(".progress-ring");
  if (rings.length) {
    const ringObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.strokeDashoffset = entry.target.dataset.offset;
          ringObs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    rings.forEach((r) => ringObs.observe(r));
  }

  // Strip HTML indentation from whitespace-pre (fixes visual left-indent caused by HTML formatting)
  document.querySelectorAll(".code-animate .whitespace-pre").forEach((pre) => {
    const tw = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = tw.nextNode())) {
      node.textContent = node.textContent.replace(/\n {12,}/g, "\n");
    }
  });

  // Duplicate code-animate content for seamless infinite scroll loop
  document.querySelectorAll(".code-animate").forEach((el) => {
    const inner = el.firstElementChild;
    if (inner) el.appendChild(inner.cloneNode(true));
  });

  // ── Projects Carousel ──
  (function () {
    const wrapper  = document.querySelector(".carousel-wrapper");
    if (!wrapper) return;

    const viewport = wrapper.querySelector(".carousel-viewport");
    const track    = wrapper.querySelector(".carousel-track");
    const dots     = wrapper.querySelectorAll(".carousel-dot");
    const bar      = wrapper.querySelector(".carousel-progress-bar");
    const counter  = wrapper.querySelector(".carousel-counter");
    const REAL     = 3;
    const INTERVAL = 10000;

    // Build: [clone-slide3][slide1][slide2][slide3][clone-slide1]
    const realSlides = Array.from(track.querySelectorAll(".carousel-slide"));
    const cloneFirst = realSlides[0].cloneNode(true);
    const cloneLast  = realSlides[REAL - 1].cloneNode(true);
    cloneFirst.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    cloneLast.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    track.appendChild(cloneFirst);
    track.insertBefore(cloneLast, realSlides[0]);
    // Valid tIdx range: 0..REAL+1 (= 0..4)

    let tIdx = 1;
    let isAnimating = false;
    let touchStartX = 0;

    // Resolve which real slide is visually shown (handles clone positions)
    function displayIdx() {
      if (tIdx <= 0)         return REAL - 1; // clone of last slide
      if (tIdx >= REAL + 1)  return 0;        // clone of first slide
      return tIdx - 1;
    }

    function updateUI() {
      const di = displayIdx();
      dots.forEach((d, i) => d.classList.toggle("active", i === di));
      if (counter) counter.textContent = `${di + 1} / ${REAL}`;
      // Trigger description text animation for current slide
      document.dispatchEvent(new CustomEvent("carouselSlide", { detail: { index: di } }));
    }

    function moveTo(newIdx) {
      if (isAnimating) return; // block rapid clicks during animation
      isAnimating = true;
      tIdx = newIdx;
      track.style.transition = "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)";
      track.style.transform  = `translateX(-${tIdx * 100}%)`;
      updateUI();
    }

    // After animation ends, silently snap back from clones to real slides
    track.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "transform") return;
      const TOTAL = REAL + 2;
      if (tIdx >= TOTAL - 1) {
        track.style.transition = "none";
        tIdx = 1;
        track.style.transform = "translateX(-100%)";
      } else if (tIdx <= 0) {
        track.style.transition = "none";
        tIdx = REAL;
        track.style.transform  = `translateX(-${REAL * 100}%)`;
      }
      requestAnimationFrame(() => { isAnimating = false; });
    });

    function prev() { moveTo(tIdx - 1); }
    function next() { moveTo(tIdx + 1); }

    wrapper.querySelector(".carousel-btn--prev").addEventListener("click", prev);
    wrapper.querySelector(".carousel-btn--next").addEventListener("click", next);
    dots.forEach((d) => d.addEventListener("click", () => moveTo(+d.dataset.index + 1)));

    viewport.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    });

    document.addEventListener("keydown", (e) => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    });

    track.style.transition = "none";
    track.style.transform  = "translateX(-100%)";
    updateUI();
  })();

  // IDE Typewriter animation for custom card
  (function () {
    const body = document.getElementById("ideTypewriterBody");
    const statusLine = document.getElementById("ideStatusLine");
    if (!body) return;

    const lines = [
      '<span class="text-pink-400">from</span> fastapi <span class="text-pink-400">import</span> FastAPI, HTTPException',
      '<span class="text-pink-400">from</span> pydantic <span class="text-pink-400">import</span> BaseModel, EmailStr, Field',
      '<span class="text-pink-400">import</span> logging',
      '',
      '<span class="text-slate-500"># 業務データの定義：入力段階でミスを防ぐ</span>',
      '<span class="text-pink-400">class</span> <span class="text-blue-300">AutomationTask</span>(BaseModel):',
      '    task_name: <span class="text-blue-300">str</span> = <span class="text-[#45b059]">Field</span>(..., description=<span class="text-orange-300">"業務名"</span>)',
      '    assignee_email: <span class="text-blue-300">EmailStr</span> = <span class="text-[#45b059]">Field</span>(...)',
      '    priority: <span class="text-blue-300">int</span> = <span class="text-[#45b059]">Field</span>(<span class="text-orange-300">1</span>, ge=<span class="text-orange-300">1</span>, le=<span class="text-orange-300">5</span>)',
      '',
      'app = <span class="text-[#45b059]">FastAPI</span>(title=<span class="text-orange-300">"Felis Code 業務自動化エンジン"</span>)',
      '',
      '<span class="text-pink-400">@app.post</span>(<span class="text-orange-300">"/api/v1/execute-task"</span>, status_code=<span class="text-orange-300">201</span>)',
      '<span class="text-pink-400">async def</span> <span class="text-yellow-300">run_business_logic</span>(task: <span class="text-blue-300">AutomationTask</span>):',
      '    <span class="text-slate-500">"""手作業を自動化し、ヒューマンエラーを排除"""</span>',
      '    result = {',
      '        <span class="text-orange-300">"efficiency_gain"</span>: <span class="text-orange-300">"手作業の約85%を削減"</span>,',
      '        <span class="text-orange-300">"infrastructure"</span>: <span class="text-orange-300">"Managed Cloud"</span>',
      '    }',
      '    <span class="text-pink-400">return</span> result',
      '',
      '<span class="text-pink-400">@app.get</span>(<span class="text-orange-300">"/health"</span>)',
      '<span class="text-pink-400">async def</span> <span class="text-yellow-300">health_check</span>():',
      '    <span class="text-pink-400">return</span> {<span class="text-orange-300">"status"</span>: <span class="text-orange-300">"Healthy"</span>}',
    ];

    // Build line elements
    const lineEls = lines.map((html) => {
      const el = document.createElement("div");
      el.className = "ide-line";
      el.innerHTML = html || " ";
      body.appendChild(el);
      return el;
    });

    let animated = false;
    function animate() {
      if (animated) return;
      animated = true;
      lineEls.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add("revealed");
          if (statusLine) statusLine.textContent = "Ln " + (i + 1);
        }, i * 55);
      });
    }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { animate(); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(body);
  })();

  // Generate line numbers for code editor
  (function () {
    const nums = document.getElementById("codeLineNums");
    if (!nums) return;
    const pre = nums.closest(".code-editor-body")?.querySelector("pre");
    if (!pre) return;
    const lineCount = (pre.textContent.match(/\n/g) || []).length + 1;
    nums.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  })();

  // Generate IDE minimap bars (approximate code structure)
  (function () {
    const minimap = document.querySelector(".ide-minimap");
    if (!minimap) return;
    const lines = [
      [0.85, "#6b7280"], [0.50, "#f472b6"], [0.60, "#fde047"],
      [0.65, "#fde047"], [0.55, "#fde047"], [0.55, "#fde047"],
      [0.12, "#cbd5e1"], [0.70, "#fde047"], [0.08, "transparent"],
      [0.40, "#45b059"], [0.55, "#93c5fd"], [0.72, "#fde047"],
      [0.88, "#fb923c"], [0.75, "#fde047"], [0.95, "#fb923c"],
      [0.18, "#93c5fd"], [0.62, "#93c5fd"], [0.82, "#fb923c"],
      [0.18, "#93c5fd"], [0.50, "#93c5fd"], [0.18, "#93c5fd"],
      [0.55, "#93c5fd"], [0.30, "#cbd5e1"], [0.28, "#93c5fd"],
      [0.45, "#93c5fd"], [0.28, "#cbd5e1"], [0.28, "#93c5fd"],
      [0.50, "#93c5fd"], [0.18, "#93c5fd"],
    ];
    lines.forEach(([w, c]) => {
      const bar = document.createElement("div");
      bar.className = "mmbar";
      bar.style.width = Math.round(w * 12) + "px";
      bar.style.background = c;
      minimap.appendChild(bar);
    });
  })();

  // Animate description text — reveal once on first view, then stay fixed
  const descEls = document.querySelectorAll(".desc-animate");

  function revealDescForSlide(idx) {
    descEls.forEach((el) => {
      if (+el.dataset.slideIdx === idx && !el.dataset.revealed) {
        el.dataset.revealed = "1";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => el.classList.add("desc-revealed"));
        });
      }
    });
  }

  // Listen for slide changes
  document.addEventListener("carouselSlide", (e) => revealDescForSlide(e.detail.index));

  // Trigger immediately for slide 0 (listener registered after IIFE, so dispatch was missed)
  revealDescForSlide(0);

  // Service → Project carousel navigation (anchor links inside carousel slides)
  const projectSlotMap = { "project-web": 0, "project-saas": 1, "project-custom": 2 };
  document.querySelectorAll('a[href^="#project-"]').forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    if (!(id in projectSlotMap)) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const carousel = document.querySelector(".carousel-wrapper");
      if (!carousel) return;
      // Navigate carousel to the correct slide (dot index = real slide index)
      const dot = carousel.querySelectorAll(".carousel-dot")[projectSlotMap[id]];
      if (dot) dot.click();
      // Scroll to the projects section
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Close mobile menu when any link inside it is tapped
  document.querySelectorAll("#mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      document.getElementById("mobile-menu").classList.remove("open");
      const icon = document.getElementById("ham-icon");
      if (icon) icon.textContent = "≡";
    });
  });

});
