// instrumentation.ts — runs once in the Next.js server process on startup.
// The QVAC SDK loads native (.node) modules that keep libuv handles open, which
// prevents Node.js from exiting naturally after Ctrl+C. We register a one-time
// SIGINT handler that gives the SDK ~3 s to finish cleanup, then force-exits.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.once("SIGINT", () => {
      setTimeout(() => {
        process.exit(0);
      }, 3000).unref();
    });

    const { warmupModels } = await import("@/lib/qvac/qvacClient");
    warmupModels();
  }
}
