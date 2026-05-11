"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f4f6f9",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)"
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px"
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(13,158,126,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L4 5v6c0 5.55 3.84 10.74 8 11.93C16.16 21.74 20 16.55 20 11V5L12 2z"
                fill="#0d9e7e"
              />
              {/* wifi-off lines */}
              <line x1="8" y1="14" x2="16" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="11" x2="12" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="2" x2="22" y2="22" stroke="#0d9e7e" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 10px"
          }}
        >
          You&rsquo;re offline
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.65,
            margin: "0 0 28px"
          }}
        >
          Guardian runs entirely on your device — no cloud required. This page shows when the local server
          can&rsquo;t be reached (e.g. it&rsquo;s not running, or your browser has blocked all network
          access). Internet is only needed for on-chain wallet and signature lookups.
        </p>

        {/* Steps */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px 20px",
            textAlign: "left",
            marginBottom: "24px"
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151",
              margin: "0 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            To get back
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              fontSize: "13px",
              color: "#64748b",
              lineHeight: 1.7
            }}
          >
            <li>
              Start the local server if it isn&rsquo;t running:{" "}
              <code
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "12px",
                  background: "#e2e8f0",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  color: "#1e293b"
                }}
              >
                npm run dev
              </code>
            </li>
            <li>
              If using browser DevTools &ldquo;Offline&rdquo; mode, disable it — it blocks localhost too
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={() => window.location.reload()}
          style={{
            width: "100%",
            background: "#0d9e7e",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
