export function qvacBadgeClass(active: boolean) {
  return active ? "badge-qvac-active" : "badge-qvac-mock";
}

export default function QvacBadge({
  active,
  activeLabel,
  inactiveLabel
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      title="QVAC runs AI inference locally on your device. No cloud AI is used. Wallet profile lookups use the public Solana RPC."
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${qvacBadgeClass(active)}`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
