(function () {
  "use strict";

  console.log("[Guardian] interceptor.js start — world:", typeof window !== "undefined" ? "MAIN" : "unknown");

  if (window.__guardian_initialized) {
    console.log("[Guardian] already initialized, skipping");
    return;
  }
  window.__guardian_initialized = true;

  const GUARDIAN_TIMEOUT_MS = 12000;
  const WALLET_POLL_INTERVAL_MS = 300;
  const WALLET_POLL_TIMEOUT_MS = 5000;
  const CANCEL_MESSAGE = "Transaction cancelled by Guardian Wallet Firewall.";
  const ALLOWED_RISK_LEVELS = new Set(["safe", "low", "medium", "high", "critical"]);

  function safeDefine(obj, prop, value) {
    try {
      Object.defineProperty(obj, prop, { value, configurable: true, writable: true });
    } catch (_) {
      try {
        obj[prop] = value;
      } catch (_2) {
        // property is non-configurable and non-writable; skip
      }
    }
  }

  // Intercept Wallet Standard path A: app dispatches "wallet-standard:app-ready"
  try {
    const _origAddEventListener = window.addEventListener.bind(window);
    window.addEventListener = function (type, listener, ...rest) {
      if (type === "wallet-standard:app-ready") {
        const wrapped = function (event) {
          const origReg = event.detail?.register;
          if (origReg) {
            safeDefine(event.detail, "register", function (wallet) {
              patchWalletStandard(wallet);
              return origReg(wallet);
            });
          }
          return listener.call(this, event);
        };
        return _origAddEventListener(type, wrapped, ...rest);
      }
      return _origAddEventListener(type, listener, ...rest);
    };
  } catch (e) {
    console.warn("[Guardian] could not wrap addEventListener:", e);
  }

  // Intercept Wallet Standard path B: wallet dispatches "wallet-standard:register-wallet"
  try {
    const _dispatchEvent = window.dispatchEvent.bind(window);
    window.dispatchEvent = function (event) {
      if (event.type === "wallet-standard:register-wallet" && event.detail?.register) {
        const origReg = event.detail.register;
        safeDefine(event.detail, "register", function (pushOrInterface) {
          let patched = pushOrInterface;
          if (typeof pushOrInterface === "function") {
            patched = function (...wallets) {
              wallets.forEach((w) => patchWalletStandard(w));
              return pushOrInterface(...wallets);
            };
          } else if (pushOrInterface && typeof pushOrInterface.push === "function") {
            patched = Object.assign(Object.create(Object.getPrototypeOf(pushOrInterface)), pushOrInterface, {
              push(...wallets) {
                wallets.forEach((w) => patchWalletStandard(w));
                return pushOrInterface.push(...wallets);
              }
            });
          }
          return origReg(patched);
        });
      }
      // Path A fallback: also cover app-ready dispatched by the app itself
      if (event.type === "wallet-standard:app-ready" && event.detail?.register) {
        const origReg = event.detail.register;
        safeDefine(event.detail, "register", function (wallet) {
          patchWalletStandard(wallet);
          return origReg(wallet);
        });
      }
      return _dispatchEvent(event);
    };
  } catch (e) {
    console.warn("[Guardian] could not wrap dispatchEvent:", e);
  }

  // Extract the transaction from Wallet Standard feature call arguments.
  // Current spec: feature.method({ account, transaction, chain }) — rest-param style
  //   → args[0] = { transaction, account, chain }, args[0].transaction = bytes
  // Legacy spec: feature.method([{ account, transaction, chain }]) — array style
  //   → args[0] = [{ transaction }], args[0][0].transaction = bytes
  function extractWalletStandardTx(args) {
    const first = args[0];
    return first?.transaction ?? first?.[0]?.transaction ?? null;
  }

  function patchWalletStandard(wallet) {
    if (wallet?.__guardian_ws) return;
    if (wallet) wallet.__guardian_ws = true;
    console.log("[Guardian] patching Wallet Standard wallet:", wallet?.name ?? "unknown");
    const features = wallet?.features ?? {};

    const sast = features["solana:signAndSendTransaction"];
    if (sast && typeof sast.signAndSendTransaction === "function" && !sast.__guardian) {
      const orig = sast.signAndSendTransaction.bind(sast);
      sast.signAndSendTransaction = wrapSigningMethod(orig, extractWalletStandardTx);
      sast.__guardian = true;
    }

    const st = features["solana:signTransaction"];
    if (st && typeof st.signTransaction === "function" && !st.__guardian) {
      const orig = st.signTransaction.bind(st);
      st.signTransaction = wrapSigningMethod(orig, extractWalletStandardTx);
      st.__guardian = true;
    }
  }

  function txToBase64(transaction) {
    try {
      let bytes;
      if (transaction instanceof Uint8Array) {
        // Modern Wallet Standard passes pre-serialized bytes directly
        bytes = transaction;
      } else {
        bytes = transaction.serialize
          ? transaction.serialize({ requireAllSignatures: false, verifySignatures: false })
          : transaction.message?.serialize?.();
      }
      if (!bytes) return null;
      const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      // Encode in chunks to avoid stack overflow on large transactions
      let binary = "";
      const CHUNK = 8192;
      for (let i = 0; i < arr.length; i += CHUNK) {
        binary += String.fromCharCode(...arr.subarray(i, i + CHUNK));
      }
      return btoa(binary);
    } catch {
      return null;
    }
  }

  // Routes through relay.js (ISOLATED world) -> background.js to avoid CORS
  const pendingRequests = {};
  window.addEventListener("message", function (e) {
    if (e.source !== window || e.data?.__guardian_relay !== "response") return;
    const cb = pendingRequests[e.data.id];
    if (cb) {
      delete pendingRequests[e.data.id];
      cb(e.data.result);
    }
  });

  function generateId() {
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    return buf[0].toString(36) + buf[1].toString(36) + buf[2].toString(36) + buf[3].toString(36);
  }

  function analyzeTransaction(base64) {
    return new Promise((resolve) => {
      const id = generateId();
      const origin = window.location.origin || "*";
      const timer = setTimeout(() => {
        delete pendingRequests[id];
        resolve(null);
      }, GUARDIAN_TIMEOUT_MS);
      pendingRequests[id] = (result) => {
        clearTimeout(timer);
        resolve(result);
      };
      window.postMessage(
        { __guardian_relay: "request", id, base64Transaction: base64, context: "pre-sign" },
        origin
      );
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const LEVEL_COLORS = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    safe: "#22c55e",
    low: "#22c55e"
  };

  function levelColor(level) {
    return LEVEL_COLORS[level] ?? "#22c55e";
  }

  function showRiskOverlay(result, base64Tx) {
    return new Promise((resolve) => {
      const existing = document.getElementById("guardian-overlay");
      if (existing) existing.remove();

      const { assessment, explanation } = result;
      const rawLevel = String(assessment?.level ?? "").toLowerCase();
      const level = ALLOWED_RISK_LEVELS.has(rawLevel) ? rawLevel : "low";
      const score = typeof assessment?.score === "number" ? assessment.score : 0;
      const summary = escapeHtml(explanation?.summary ?? "Guardian analyzed this transaction.");
      const action = escapeHtml(explanation?.suggestedAction ?? "");
      const findings = (assessment?.findings ?? []).slice(0, 3);

      const color = levelColor(level);
      const isDangerous = level === "critical" || level === "high";

      const overlay = document.createElement("div");
      overlay.id = "guardian-overlay";
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;

      overlay.innerHTML = `
        <div style="
          background: #fff; border-radius: 16px; width: 420px; max-width: 95vw;
          box-shadow: 0 24px 64px rgba(0,0,0,0.25); overflow: hidden;
        ">
          <div style="background: #0d9e7e; padding: 16px 20px; display: flex; align-items: center; gap: 12px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 11.93C16.16 21.74 20 16.55 20 11V5L12 2z" fill="white" fill-opacity="0.9"/>
            </svg>
            <div>
              <div style="color: white; font-weight: 700; font-size: 15px;">Guardian Wallet Firewall</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 12px;">Transaction risk analysis</div>
            </div>
          </div>

          <div style="padding: 20px; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Risk Level</div>
                <div style="font-size: 28px; font-weight: 800; color: ${color}; text-transform: uppercase; margin-top: 2px;">${escapeHtml(level)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500;">Score</div>
                <div style="font-size: 36px; font-weight: 800; color: ${color}; line-height: 1;">${score}</div>
                <div style="font-size: 11px; color: #94a3b8;">/ 100</div>
              </div>
            </div>
          </div>

          <div style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-size: 13px; line-height: 1.6; color: #374151;">${summary}</div>
            ${action ? '<div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: ' + color + ';">' + action + "</div>" : ""}
          </div>

          ${
            findings.length > 0
              ? '<div style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">' +
                findings
                  .map(function (f) {
                    var sev = ALLOWED_RISK_LEVELS.has(String(f.severity ?? "").toLowerCase())
                      ? String(f.severity).toLowerCase()
                      : "low";
                    var sevColor = levelColor(sev);
                    return (
                      '<div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">' +
                      '<span style="flex-shrink: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-top: 1px; background: ' +
                      sevColor +
                      "20; color: " +
                      sevColor +
                      "; border: 1px solid " +
                      sevColor +
                      '40;">' +
                      escapeHtml(sev) +
                      "</span>" +
                      '<span style="font-size: 12px; color: #374151;">' +
                      escapeHtml(String(f.title ?? "")) +
                      "</span>" +
                      "</div>"
                    );
                  })
                  .join("") +
                "</div>"
              : ""
          }

          <div style="padding: 16px 20px; display: flex; gap: 10px;">
            <button id="guardian-cancel" style="
              flex: 1; padding: 11px; border-radius: 10px; font-size: 14px; font-weight: 600;
              cursor: pointer; border: 2px solid #e2e8f0; background: white; color: #374151;
              transition: background 0.15s;
            ">Cancel transaction</button>
            <button id="guardian-proceed" style="
              flex: 1; padding: 11px; border-radius: 10px; font-size: 14px; font-weight: 600;
              cursor: pointer; border: none;
              background: ${isDangerous ? "#ef444415" : "#0d9e7e"};
              color: ${isDangerous ? "#ef4444" : "white"};
              border: 2px solid ${isDangerous ? "#ef4444" : "#0d9e7e"};
            ">
              ${isDangerous ? "&#9888; Proceed anyway" : "Looks good, proceed"}
            </button>
          </div>

          <div style="padding: 8px 20px 12px; text-align: center;">
            <a href="http://localhost:3000/?tx=${encodeURIComponent(base64Tx || "")}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #94a3b8; text-decoration: none;">
              Open Guardian for full analysis &#8594;
            </a>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById("guardian-cancel").addEventListener("click", () => {
        overlay.remove();
        resolve(false);
      });
      document.getElementById("guardian-proceed").addEventListener("click", () => {
        overlay.remove();
        resolve(true);
      });

      function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          overlay.remove();
          resolve(false);
        }
      }
      document.addEventListener("keydown", onKey);
    });
  }

  function shouldShowOverlay(result) {
    const level = String(result?.assessment?.level ?? "").toLowerCase();
    return level === "medium" || level === "high" || level === "critical";
  }

  function wrapSigningMethod(originalFn, getTransaction) {
    return async function guardianSigningInterceptor(...args) {
      const transaction = getTransaction(args);
      if (transaction) {
        const base64 = txToBase64(transaction);
        if (base64) {
          console.log("[Guardian] intercepted signing — analyzing transaction…");
          const result = await analyzeTransaction(base64);
          const level = String(result?.assessment?.level ?? "null").toLowerCase();
          const score = result?.assessment?.score ?? "?";
          console.log(
            "[Guardian] analysis result — level:",
            level,
            "score:",
            score,
            result ? "" : "(null — server unreachable or timed out)"
          );
          if (result && shouldShowOverlay(result)) {
            const proceed = await showRiskOverlay(result, base64);
            if (!proceed) throw new Error(CANCEL_MESSAGE);
          }
        }
      }
      return originalFn.apply(this, args);
    };
  }

  function attachGuardian(wallet) {
    if (wallet.__guardian_attached) return;
    wallet.__guardian_attached = true;

    if (typeof wallet.signTransaction === "function") {
      wallet.signTransaction = wrapSigningMethod(wallet.signTransaction.bind(wallet), (args) => args[0]);
    }
    if (typeof wallet.signAllTransactions === "function") {
      wallet.signAllTransactions = wrapSigningMethod(
        wallet.signAllTransactions.bind(wallet),
        (args) => args[0]?.[0]
      );
    }
    if (typeof wallet.signAndSendTransaction === "function") {
      wallet.signAndSendTransaction = wrapSigningMethod(
        wallet.signAndSendTransaction.bind(wallet),
        (args) => args[0]
      );
    }
  }

  function watchForWallets() {
    // window.phantom.solana is the modern Phantom entry point (MV3+ / 2024+)
    if (window.phantom?.solana) attachGuardian(window.phantom.solana);
    // window.solana is the legacy Phantom entry point — still present on some sites
    if (window.solana && window.solana !== window.phantom?.solana) attachGuardian(window.solana);
    if (window.backpack?.solana) attachGuardian(window.backpack.solana);
    if (window.solflare) attachGuardian(window.solflare);
  }

  watchForWallets();
  const poll = setInterval(watchForWallets, WALLET_POLL_INTERVAL_MS);
  setTimeout(() => clearInterval(poll), WALLET_POLL_TIMEOUT_MS);
  window.addEventListener("load", watchForWallets, { once: true });
})();
