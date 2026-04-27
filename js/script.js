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
    let timer = null, rafId = null, startTime = 0, touchStartX = 0;

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
    }

    function moveTo(newIdx) {
      if (isAnimating) return; // block rapid clicks during animation
      isAnimating = true;
      tIdx = newIdx;
      track.style.transition = "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)";
      track.style.transform  = `translateX(-${tIdx * 100}%)`;
      updateUI();
      resetProgress();
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

    function resetProgress() {
      cancelAnimationFrame(rafId);
      bar.style.transition = "none";
      bar.style.width = "0%";
      if (timer) animateBar();
    }

    function animateBar() {
      startTime = performance.now();
      rafId = requestAnimationFrame(function tick(now) {
        const pct = Math.min(((now - startTime) / INTERVAL) * 100, 100);
        bar.style.width = pct + "%";
        if (pct < 100) rafId = requestAnimationFrame(tick);
      });
    }

    function startAuto() {
      timer = setInterval(next, INTERVAL);
      animateBar();
    }

    function stopAuto() {
      clearInterval(timer); timer = null;
      cancelAnimationFrame(rafId);
      bar.style.transition = "none";
      bar.style.width = "0%";
    }

    wrapper.querySelector(".carousel-btn--prev").addEventListener("click", () => { stopAuto(); prev(); startAuto(); });
    wrapper.querySelector(".carousel-btn--next").addEventListener("click", () => { stopAuto(); next(); startAuto(); });
    dots.forEach((d) => d.addEventListener("click", () => { stopAuto(); moveTo(+d.dataset.index + 1); startAuto(); }));

    wrapper.addEventListener("mouseenter", stopAuto);
    wrapper.addEventListener("mouseleave", startAuto);

    viewport.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { stopAuto(); diff > 0 ? next() : prev(); startAuto(); }
    });

    document.addEventListener("keydown", (e) => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
      if (e.key === "ArrowLeft")  { stopAuto(); prev(); startAuto(); }
      if (e.key === "ArrowRight") { stopAuto(); next(); startAuto(); }
    });

    track.style.transition = "none";
    track.style.transform  = "translateX(-100%)";
    updateUI();
    startAuto();
  })();

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
