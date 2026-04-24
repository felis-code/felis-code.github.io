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
