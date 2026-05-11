const GUARDIAN_STATUS_URL = "http://localhost:3000/api/qvac-status";

const dot = document.getElementById("status-dot");
const text = document.getElementById("status-text");
const interceptInfo = document.getElementById("intercept-info");

async function checkServer() {
  if (!dot || !text) return;
  dot.className = "dot dot-yellow";
  text.textContent = "Checking…";

  try {
    const res = await fetch(GUARDIAN_STATUS_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    dot.className = "dot dot-green";
    const total = Object.keys(data).length;
    const active = Object.values(data).filter(Boolean).length;
    text.textContent = total > 0 ? `Running — ${active}/${total} capabilities active` : "Running";
  } catch (err) {
    dot.className = "dot dot-red";
    const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
    text.textContent = isTimeout
      ? "Server timed out — is Guardian running?"
      : "Not running — start Guardian app first";
    if (interceptInfo) {
      interceptInfo.className = "intercept-status inactive";
      interceptInfo.textContent =
        "⚠ Guardian server offline — transactions will NOT be analyzed until it is running.";
    }
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url ?? "";
  const isBrowser = url.startsWith("http://") || url.startsWith("https://");
  if (!isBrowser && interceptInfo) {
    interceptInfo.className = "intercept-status inactive";
    interceptInfo.textContent = "Interceptor only runs on web pages (http/https).";
  }
});

document.getElementById("refresh-btn")?.addEventListener("click", checkServer);

checkServer();
