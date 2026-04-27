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

  // ── Projects Carousel ──
  (function () {
    const wrapper  = document.querySelector(".carousel-wrapper");
    if (!wrapper) return;

    const viewport = wrapper.querySelector(".carousel-viewport");
    const track    = wrapper.querySelector(".carousel-track");
    const dots     = wrapper.querySelectorAll(".carousel-dot");
    const bar      = wrapper.querySelector(".carousel-progress-bar");
    const counter  = wrapper.querySelector(".carousel-counter");
    const REAL     = 3;       // number of real slides
    const INTERVAL = 10000;   // 10s auto-play

    // Clone first and last slides for seamless infinite loop
    // Track order after cloning: [clone-3][slide-1][slide-2][slide-3][clone-1]
    const realSlides = Array.from(track.querySelectorAll(".carousel-slide"));
    const cloneFirst = realSlides[0].cloneNode(true);
    const cloneLast  = realSlides[REAL - 1].cloneNode(true);
    cloneFirst.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    cloneLast.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    track.appendChild(cloneFirst);
    track.insertBefore(cloneLast, realSlides[0]);

    let tIdx = 1; // trackIndex: 1 = slide-1, 2 = slide-2, 3 = slide-3
    let timer = null, rafId = null, startTime = 0, touchStartX = 0, jumping = false;

    function realIdx() { return tIdx - 1; } // 0-based real index

    function updateUI() {
      dots.forEach((d, i) => d.classList.toggle("active", i === realIdx()));
      if (counter) counter.textContent = `${realIdx() + 1} / ${REAL}`;
    }

    function moveTo(newIdx) {
      if (jumping) return;
      tIdx = newIdx;
      track.style.transition = "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)";
      track.style.transform  = `translateX(-${tIdx * 100}%)`;
      updateUI();
      resetProgress();
    }

    // After each animated transition, silently jump if we landed on a clone
    track.addEventListener("transitionend", () => {
      const total = REAL + 2;
      if (tIdx === total - 1) {        // landed on clone-1 → jump to slide-1
        jumping = true;
        track.style.transition = "none";
        tIdx = 1;
        track.style.transform = "translateX(-100%)";
        requestAnimationFrame(() => { jumping = false; });
      } else if (tIdx === 0) {          // landed on clone-3 → jump to slide-3
        jumping = true;
        track.style.transition = "none";
        tIdx = REAL;
        track.style.transform  = `translateX(-${REAL * 100}%)`;
        requestAnimationFrame(() => { jumping = false; });
      }
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

    // Initialize: position at slide-1, no animation
    track.style.transition = "none";
    track.style.transform  = "translateX(-100%)";
    updateUI();
    startAuto();
  })();

  // Close mobile menu when any link inside it is tapped
  document.querySelectorAll("#mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      document.getElementById("mobile-menu").classList.remove("open");
      const icon = document.getElementById("ham-icon");
      if (icon) icon.textContent = "≡";
    });
  });

  // Show "← Services" pill while the Projects section is visible
  const projectsSection = document.getElementById("projects");
  const backToServices = document.getElementById("backToServices");
  if (projectsSection && backToServices) {
    const servicesObserver = new IntersectionObserver(
      ([entry]) => backToServices.classList.toggle("show", entry.isIntersecting),
      { threshold: 0.05 }
    );
    servicesObserver.observe(projectsSection);
  }
});
