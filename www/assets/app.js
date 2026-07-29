(() => {
  "use strict";

  const config = window.TARHIMSAZ_APP_CONFIG;
  const grid = document.getElementById("categoriesGrid");
  const navigationLoading = document.getElementById("navigationLoading");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function navigateInsideApp(url) {
    navigationLoading.classList.remove("hidden");
    window.setTimeout(() => window.location.assign(url), 40);
  }

  function createCategoryCard(category) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";
    button.setAttribute("aria-label", `مشاهده ${category.title}`);
    button.innerHTML = `
      <span class="category-image-wrap">
        <img class="category-image" src="${escapeHtml(category.image)}" alt="" loading="lazy" decoding="async" />
      </span>
      <span class="category-content">
        <strong>${escapeHtml(category.title)}</strong>
        <small>مشاهده همه</small>
      </span>
    `;
    button.addEventListener("click", () => navigateInsideApp(category.url));
    return button;
  }

  grid.replaceChildren(...config.categories.map(createCategoryCard));

  document.querySelector('[data-nav="home"]').addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll('a[data-app-link="true"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigateInsideApp(link.href);
    });
  });

  window.addEventListener("pageshow", () => navigationLoading.classList.add("hidden"));
})();
