(function configurePecBot() {
  const defaults = {
    apiBase: "https://guacamole-paddle-celtic.ngrok-free.dev",
    chatPath: "/chat",
    openMode: "same-tab",
    widgetCssPath: "/widget.css",
    botName: "PEC Bot",
    admissionPhone: "+91- 90438 91272 / 90438 90983"
  };

  window.PEC_CHAT_CONFIG = Object.assign({}, defaults, window.PEC_CHAT_CONFIG || {});
})();
