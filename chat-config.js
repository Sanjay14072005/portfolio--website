(function configurePecBot() {
  const defaults = {
    apiBase: window.location.origin,
    endpoints: {
      authToken: "/api/auth/token",
      chat: "/api/chat",
      history: "/api/chat/history"
    },
    chatPagePath: "/chat",
    openMode: "same-tab",
    widgetCssPath: "/widget.css",
    botName: "PEC Bot",
    admissionPhone: "+91- 90438 91272 / 90438 90983"
  };

  window.PEC_CHAT_CONFIG = Object.assign({}, defaults, window.PEC_CHAT_CONFIG || {});
})();
