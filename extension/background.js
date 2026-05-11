const GUARDIAN_API = "http://localhost:3000/api/analyze-transaction";
const FETCH_TIMEOUT_MS = 10000;
const VALID_CONTEXTS = new Set(["pre-sign", "sender", "recipient", "viewer"]);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "guardian-analyze") return false;

  const base64Transaction = message.base64Transaction;
  const context = VALID_CONTEXTS.has(message.context) ? message.context : "pre-sign";

  if (typeof base64Transaction !== "string" || !base64Transaction) {
    sendResponse(null);
    return false;
  }
  if (base64Transaction.length > 20_000) {
    sendResponse(null);
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  fetch(GUARDIAN_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ base64Transaction, context }),
    signal: controller.signal
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((result) => sendResponse(result))
    .catch((err) => {
      if (err.name !== "AbortError") console.error("[Guardian] analyze-transaction failed:", err.message);
      sendResponse(null);
    })
    .finally(() => clearTimeout(timeout));

  return true;
});
