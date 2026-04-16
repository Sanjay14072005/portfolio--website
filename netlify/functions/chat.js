const { getModelApiBaseUrl } = require("./_model-config");
const { getOrCreateSession, buildSessionCookie } = require("./_session");

function safeJsonParse(value) {
  try {
    return JSON.parse(value || "{}");
  } catch (_) {
    return {};
  }
}

exports.handler = async function chatHandler(event) {
  if ((event.httpMethod || "").toUpperCase() !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const payload = safeJsonParse(event.body);
  const message = String(payload.message || "").trim();
  if (!message) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "message is required" })
    };
  }

  const modelApiBase = getModelApiBaseUrl();
  const modelUrl = `${modelApiBase}/generate`;
  const { sessionId, shouldSetCookie } = getOrCreateSession(event);

  try {
    const upstream = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        message,
        history: [],
        session_id: sessionId
      })
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return {
        statusCode: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          error: "Upstream model service error",
          detail: text.slice(0, 300)
        })
      };
    }

    const data = safeJsonParse(text);
    const response = String(data.response || "").trim();
    const headers = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    };
    if (shouldSetCookie) {
      headers["set-cookie"] = buildSessionCookie(sessionId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: response || "I could not generate a response right now. Please try again.",
        sources: Array.isArray(data.sources) ? data.sources : [],
        model: data.model || null
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        error: "Unable to reach model service",
        detail: String(error && error.message ? error.message : error)
      })
    };
  }
};
