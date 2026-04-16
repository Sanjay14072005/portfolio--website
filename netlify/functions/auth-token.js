const { getOrCreateSession, buildSessionCookie } = require("./_session");

exports.handler = async function authTokenHandler(event) {
  const { sessionId, shouldSetCookie } = getOrCreateSession(event);
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
      ok: true,
      session_id: sessionId
    })
  };
};
