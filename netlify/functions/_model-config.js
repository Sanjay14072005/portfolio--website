const DEFAULT_MODEL_API_BASE = "https://guacamole-paddle-celtic.ngrok-free.dev";

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function getModelApiBaseUrl() {
  return normalizeBaseUrl(process.env.MODEL_API_BASE || DEFAULT_MODEL_API_BASE);
}

module.exports = {
  DEFAULT_MODEL_API_BASE,
  getModelApiBaseUrl
};
