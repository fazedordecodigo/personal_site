(() => {
  "use strict";

  const DESKTOP_QUERY = "(min-width: 481px)";
  const DEFAULT_TIMEOUT_MS = 12_000;
  const EMBED_URL = "https://fazedordecodigo.substack.com/embed";
  const LOADING_TEXT = "Solicitação enviada ao Substack. Se a área abaixo não funcionar, use Assinar no Substack.";
  const LOADED_TEXT = "O navegador concluiu a navegação do iframe, mas esta página não consegue confirmar o conteúdo interno nem a inscrição.";
  const TIMEOUT_TEXT = "Não foi possível confirmar o carregamento do formulário. Use Assinar no Substack.";

  const button = document.getElementById("load-substack");
  const facade = document.getElementById("embed-facade");
  const mobileMessage = document.getElementById("mobile-embed-message");
  const panel = document.getElementById("iframe-panel");
  const status = document.getElementById("iframe-status");
  const frame = document.getElementById("substack-frame");
  const externalLink = document.querySelector(".external-link");

  if (!button || !facade || !mobileMessage || !panel || !status || !frame || !externalLink) return;

  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  let requested = false;

  function isDesktop() {
    return mediaQuery.matches;
  }

  function readTimeout() {
    const rawValue = frame.getAttribute("data-timeout-ms") ?? "";
    if (!/^\d+$/.test(rawValue)) return DEFAULT_TIMEOUT_MS;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
  }

  function syncAvailability() {
    if (requested) return;
    const desktop = isDesktop();
    button.hidden = !desktop;
    facade.hidden = !desktop;
    mobileMessage.hidden = desktop;
    panel.hidden = true;
  }

  function activate() {
    if (requested || !isDesktop() || frame.getAttribute("data-src") !== EMBED_URL) return;
    requested = true;
    button.disabled = true;
    facade.hidden = true;
    panel.hidden = false;
    panel.setAttribute("aria-busy", "true");
    status.textContent = LOADING_TEXT;
    status.focus();

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      panel.setAttribute("aria-busy", "false");
      status.textContent = TIMEOUT_TEXT;
      externalLink.classList.add("is-highlighted");
    }, readTimeout());

    frame.addEventListener("load", () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      panel.setAttribute("aria-busy", "false");
      status.textContent = LOADED_TEXT;
    }, { once: true });

    frame.setAttribute("src", EMBED_URL);
  }

  button.addEventListener("click", activate);
  syncAvailability();
  if (typeof mediaQuery.addEventListener === "function") mediaQuery.addEventListener("change", syncAvailability);
  else if (typeof mediaQuery.addListener === "function") mediaQuery.addListener(syncAvailability);
})();
