const crypto = require("node:crypto");

const SESSION_COOKIE_NAME = "pec_chat_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function parseCookies(headerValue) {
  const source = headerValue || "";
  return source.split(";").reduce((acc, segment) => {
    const [rawKey, ...rawValue] = segment.split("=");
    const key = (rawKey || "").trim();
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(rawValue.join("=").trim() || "");
    return acc;
  }, {});
}

function buildSessionCookie(sessionId) {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`
  ].join("; ");
}

function getOrCreateSession(event) {
  const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie || "");
  const existing = cookies[SESSION_COOKIE_NAME];
  if (existing) {
    return { sessionId: existing, shouldSetCookie: false };
  }

  const generated = crypto.randomUUID();
  return { sessionId: generated, shouldSetCookie: true };
}

module.exports = {
  getOrCreateSession,
  buildSessionCookie
};
