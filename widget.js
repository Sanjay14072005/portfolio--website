(function bootstrapWidget() {
  if (window.__COLLEGE_CHATBOT_WIDGET__) {
    return;
  }
  window.__COLLEGE_CHATBOT_WIDGET__ = true;

  const config = window.PEC_CHAT_CONFIG || {};
  const currentScript =
    document.currentScript || document.querySelector("script[src*='widget.js']:last-of-type");
  const scriptUrl = currentScript ? new URL(currentScript.src, window.location.href) : new URL(window.location.href);

  const apiBase = (currentScript?.dataset.apiBase || config.apiBase || scriptUrl.origin).replace(/\/+$/, "");
  const openMode = currentScript?.dataset.openMode || config.openMode || "same-tab";
  const chatPath = currentScript?.dataset.chatPath || config.chatPath || "/chat";
  const botName = currentScript?.dataset.botName || config.botName || "PEC Bot";
  const admissionPhone = currentScript?.dataset.admissionPhone || config.admissionPhone || "+91- 90438 91272 / 90438 90983";
  const cssHref = currentScript?.dataset.cssHref || config.widgetCssPath || `${scriptUrl.origin}/widget.css`;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return map[char] || char;
    });
  }

  function apiUrl(path) {
    return `${apiBase}${path}`;
  }

  if (!document.querySelector("link[data-college-chat-widget-css='true']")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    link.dataset.collegeChatWidgetCss = "true";
    document.head.appendChild(link);
  }

  const fab = document.createElement("button");
  fab.className = "cb-fab";
  fab.type = "button";
  fab.setAttribute("aria-label", "Open college assistant");
  fab.textContent = "\uD83D\uDCAC";

  const panel = document.createElement("section");
  panel.className = "cb-panel cb-hidden";
  panel.innerHTML = `
    <header class="cb-header">
      <div class="cb-heading">
        <div class="cb-title">${escapeHtml(botName)}</div>
        <div class="cb-subtitle">${escapeHtml(admissionPhone)}</div>
      </div>
      <div class="cb-actions">
        <button class="cb-icon-btn" type="button" data-action="expand" title="Open full chat">\u25A1</button>
        <button class="cb-icon-btn" type="button" data-action="close" title="Close chat">\u00D7</button>
      </div>
    </header>
    <div class="cb-messages" id="cb-messages"></div>
    <form class="cb-footer" id="cb-form">
      <input class="cb-input" id="cb-input" type="text" placeholder="Ask about admissions, courses, fees..." maxlength="2000" />
      <button class="cb-send" id="cb-send" type="submit">Send</button>
    </form>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#cb-messages");
  const formEl = panel.querySelector("#cb-form");
  const inputEl = panel.querySelector("#cb-input");
  const sendEl = panel.querySelector("#cb-send");

  function togglePanel(show) {
    panel.classList.toggle("cb-hidden", !show);
    if (show) {
      inputEl.focus();
    }
  }

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `cb-row ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "cb-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function ensureSession() {
    const response = await fetch(apiUrl("/auth/token"), {
      method: "GET",
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error("Failed to initialize chat session");
    }
  }

  let typingRow = null;
  function showTyping() {
    typingRow = document.createElement("div");
    typingRow.className = "cb-row bot";
    typingRow.innerHTML = `<div class="cb-bubble">Typing...</div>`;
    messagesEl.appendChild(typingRow);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    if (typingRow) {
      typingRow.remove();
      typingRow = null;
    }
  }

  async function sendMessage(message) {
    const response = await fetch(apiUrl("/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to get response.");
    }

    return response.json();
  }

  async function onSubmit(event) {
    event.preventDefault();
    const message = inputEl.value.trim();
    if (!message) {
      return;
    }

    inputEl.value = "";
    sendEl.disabled = true;
    addMessage("user", message);
    showTyping();

    try {
      const payload = await sendMessage(message);
      hideTyping();
      addMessage("bot", payload.response || "No response.");
    } catch (error) {
      hideTyping();
      addMessage("bot", "Sorry, something went wrong. Please try again.");
      console.error("[widget] chat error", error);
    } finally {
      sendEl.disabled = false;
      inputEl.focus();
    }
  }

  fab.addEventListener("click", () => togglePanel(panel.classList.contains("cb-hidden")));
  panel.querySelector("[data-action='close']").addEventListener("click", () => togglePanel(false));

  panel.querySelector("[data-action='expand']").addEventListener("click", () => {
    if (openMode === "same-tab") {
      window.location.assign(chatPath);
      return;
    }
    window.open(chatPath, "_blank", "noopener");
  });

  formEl.addEventListener("submit", onSubmit);

  (async () => {
    try {
      await ensureSession();
      addMessage("bot", `Hello! I am ${botName}. How can I help you today?`);
    } catch (error) {
      addMessage("bot", "Unable to start chat session. Please refresh and try again.");
      console.error("[widget] auth error", error);
    }
  })();
})();
