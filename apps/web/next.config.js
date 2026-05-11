import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: join(__dirname, "../.."),
  serverExternalPackages: [
    "@qvac/sdk",
    "@qvac/llm-llamacpp",
    "@qvac/embed-llamacpp",
    "@qvac/ocr-onnx",
    "@qvac/translation-nmtcpp"
  ],
  async headers() {
    const rules = [
      {
        // Service worker must never be HTTP-cached — browsers use their own SW update algorithm
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" }
        ]
      }
    ];

    // In development, prevent the browser from caching CSS so a normal refresh
    // always picks up Tailwind changes instead of requiring a hard refresh.
    if (process.env.NODE_ENV === "development") {
      rules.push({
        source: "/_next/static/css/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      });
    }

    return rules;
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        process: join(__dirname, "lib/process-browser-shim.cjs")
      };
    }

    return config;
  }
};

export default nextConfig;
