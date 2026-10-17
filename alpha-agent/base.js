"use strict";
/* Trusted lab host. Generated modules can register UI only in a dedicated card. */
(function () {
  const container = document.getElementById("lab-features");
  const status = document.getElementById("lab-status");
  let installed = 0;
  const names = new Set();
  function register(id, title, render) {
    if (!/^[a-z0-9-]{2,48}$/.test(id) || names.has(id) ||
        typeof title !== "string" || title.length > 100 ||
        typeof render !== "function" || installed >= 24) {
      throw new Error("Rejected malformed or duplicate agent feature");
    }
    names.add(id);
    const card = document.createElement("article");
    card.className = "feature";
    card.dataset.feature = id;
    const heading = document.createElement("h3");
    heading.textContent = title;
    card.appendChild(heading);
    const root = document.createElement("div");
    card.appendChild(root);
    container.appendChild(card);
    try {
      render(root, Object.freeze({ stage: "alpha", experimental: true }));
      installed += 1;
      status.textContent = installed + " model-built experiment" + (installed === 1 ? "" : "s") + " loaded.";
    } catch (error) {
      const explanation = document.createElement("p");
      explanation.textContent = "This experiment encountered an error. See the public GitHub Actions logs.";
      root.replaceChildren(explanation);
      status.textContent = "At least one experiment failed to initialize.";
      console.error("CivicPatch Alpha feature failed:", id, error);
    }
  }
  Object.defineProperty(window, "CivicLab", {
    value: Object.freeze({ register }), configurable: false, writable: false,
  });
  status.textContent = "Ready. Experiments will appear as the GitHub agent publishes them.";
}());
