window.addEventListener("message", async function (event) {
  if (event.source !== window || event.data?.__guardian_relay !== "request") return;

  const { id, base64Transaction, context } = event.data;
  if (!id || typeof base64Transaction !== "string" || !base64Transaction) return;
  if (typeof id !== "string" || id.length > 128 || base64Transaction.length > 20_000) return;

  const origin = window.location.origin || "*";

  try {
    const result = await chrome.runtime.sendMessage({
      type: "guardian-analyze",
      base64Transaction,
      context
    });
    window.postMessage({ __guardian_relay: "response", id, result: result ?? null }, origin);
  } catch (err) {
    window.postMessage({ __guardian_relay: "response", id, result: null, error: "relay-failed" }, origin);
  }
});
