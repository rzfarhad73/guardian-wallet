"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import {
  BLOCK_ALL_SOL_SENTINEL,
  GUARDIAN_POLICY_PRESETS,
  type GuardianPolicy,
  type GuardianPolicyMode
} from "@/lib/risk/policy";

const BLOCK_ALL_SENTINEL = BLOCK_ALL_SOL_SENTINEL;

type Props = {
  policy: GuardianPolicy;
  onPolicyChange: (policy: GuardianPolicy) => void;
};

const MODE_OPTIONS: Array<{ value: GuardianPolicyMode; label: string; description: string }> = [
  {
    value: "personal",
    label: "Personal",
    description: "Normal wallet safety rules for everyday signing."
  },
  {
    value: "dao",
    label: "DAO",
    description: "Stricter review for unknown programs and larger transfers."
  },
  {
    value: "custody",
    label: "Custody",
    description: "Strict defaults for treasury-style wallets."
  }
];

export default function InputPolicy({ policy, onPolicyChange }: Props) {
  const isBlockAll = policy.maxSolTransfer === BLOCK_ALL_SENTINEL;
  const [savedMax, setSavedMax] = useState<number | undefined>(
    isBlockAll ? undefined : policy.maxSolTransfer
  );

  function update(next: Partial<GuardianPolicy>) {
    onPolicyChange({ ...policy, ...next });
  }

  function handleBlockAllChange(checked: boolean) {
    if (checked) {
      setSavedMax(isBlockAll ? undefined : policy.maxSolTransfer);
      update({ maxSolTransfer: BLOCK_ALL_SENTINEL });
    } else {
      update({ maxSolTransfer: savedMax });
    }
  }

  return (
    <Card>
      <h3 className="text-foreground text-sm font-semibold">Guardian Policy Engine</h3>
      <p className="text-muted mt-1 text-xs">
        Server-side policy checks add blocking findings before the QVAC explanation is generated.
      </p>

      <fieldset className="mt-4">
        <legend className="text-foreground text-xs font-medium">Policy mode</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPolicyChange(GUARDIAN_POLICY_PRESETS[option.value])}
              title={option.description}
              className={`focus-visible:ring-primary rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                policy.mode === option.value ? "ctx-btn-active" : "ctx-btn"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 space-y-3">
        <Checkbox
          checked={policy.blockDelegateApprovals}
          onChange={(event) => update({ blockDelegateApprovals: event.target.checked })}
          label="Block delegate approvals"
          description="Treat token delegate approvals as policy violations."
        />

        <Checkbox
          checked={policy.blockUnknownPrograms}
          onChange={(event) => update({ blockUnknownPrograms: event.target.checked })}
          label="Block unknown programs"
          description="Require review before signing unrecognized program calls."
        />

        <Checkbox
          checked={policy.requireAuthorityChangeReview}
          onChange={(event) => update({ requireAuthorityChangeReview: event.target.checked })}
          label="Review authority changes"
          description="Escalate token or mint authority changes before signing."
        />

        <label className="flex flex-col gap-4 text-xs">
          <span className="text-foreground font-medium">Max outgoing SOL</span>
          <Input
            type="number"
            min="0.000001"
            step="0.1"
            value={isBlockAll ? "" : (policy.maxSolTransfer ?? "")}
            disabled={isBlockAll}
            placeholder={isBlockAll ? "Blocked" : ""}
            onChange={(event) =>
              update({
                maxSolTransfer: event.target.value ? Number(event.target.value) : undefined
              })
            }
            className="mt-1"
          />
          <Checkbox
            checked={isBlockAll}
            onChange={(event) => handleBlockAllChange(event.target.checked)}
            label="Block all outgoing SOL transfers"
            description="Flag any SOL transfer regardless of amount."
          />
        </label>
      </div>
    </Card>
  );
}
