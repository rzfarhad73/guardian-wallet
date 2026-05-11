export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-hover animate-pulse rounded ${className}`} />;
}
