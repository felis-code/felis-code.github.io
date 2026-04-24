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
});
