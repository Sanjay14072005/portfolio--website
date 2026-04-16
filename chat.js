(function startFullPageChat() {
  const config = window.PEC_CHAT_CONFIG || {};
  const apiBase = (config.apiBase || window.location.origin || "").replace(/\/+$/, "");
  const botName = config.botName || "PEC Bot";
  const admissionPhone = config.admissionPhone || "+91- 90438 91272 / 90438 90983";

  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendEl = document.getElementById("chat-send");
  const statusEl = document.getElementById("chat-status");
  const sideBotNameEl = document.getElementById("chat-side-bot-name");
  const sideAdmissionEl = document.getElementById("chat-side-admission");
  const topBotNameEl = document.getElementById("chat-top-bot-name");
  const topAdmissionEl = document.getElementById("chat-top-admission");

  if (!messagesEl || !formEl || !inputEl || !sendEl || !statusEl) {
    return;
  }

  if (sideBotNameEl) {
    sideBotNameEl.textContent = botName;
  }
  if (sideAdmissionEl) {
    sideAdmissionEl.textContent = `Admission: ${admissionPhone}`;
  }
  if (topBotNameEl) {
    topBotNameEl.textContent = `${botName} - Full Chat`;
  }
  if (topAdmissionEl) {
    topAdmissionEl.textContent = `Admission: ${admissionPhone}`;
  }

  function apiUrl(path) {
    return `${apiBase}${path}`;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `msg-row ${role}`;
    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = text;
    row.appendChild(msg);
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

  async function loadHistory() {
    const response = await fetch(apiUrl("/chat/history?limit=50"), {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Failed to load chat history");
    }

    const payload = await response.json();
    const history = payload.history || [];

    if (history.length === 0) {
      addMessage("bot", `Hello! I am ${botName}. Ask me anything about admissions, courses, or campus.`);
      return;
    }

    for (const item of history) {
      addMessage("user", item.user_message);
      addMessage("bot", item.bot_response);
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
      throw new Error(payload.error || "Unable to process message");
    }

    return response.json();
  }

  let typingNode = null;
  function showTyping() {
    typingNode = document.createElement("div");
    typingNode.className = "msg-row bot";
    typingNode.innerHTML = `<div class="msg">Typing...</div>`;
    messagesEl.appendChild(typingNode);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    if (typingNode) {
      typingNode.remove();
      typingNode = null;
    }
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
      addMessage("bot", payload.response || "No response returned.");
      setStatus("Online");
    } catch (error) {
      hideTyping();
      addMessage("bot", "Sorry, I hit a server issue. Please try again.");
      setStatus("Temporary issue");
      console.error("[chat] send error", error);
    } finally {
      sendEl.disabled = false;
      inputEl.focus();
    }
  }

  formEl.addEventListener("submit", onSubmit);

  (async () => {
    try {
      setStatus("Connecting...");
      await ensureSession();
      await loadHistory();
      setStatus("Online");
      inputEl.focus();
    } catch (error) {
      setStatus("Connection failed");
      addMessage("bot", "Unable to connect right now. Please refresh.");
      console.error("[chat] init error", error);
    }
  })();
})();
