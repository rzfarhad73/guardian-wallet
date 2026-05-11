export default function Callout() {
  return (
    <div className="border-border rounded-lg border bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Requires local server</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
        The extension connects to <code className="font-mono">localhost:3000</code>. Run{" "}
        <code className="font-mono">npm run dev</code> in the project directory before using it. The extension
        is not on the Chrome Web Store. It is a local developer tool.
      </p>
    </div>
  );
}
