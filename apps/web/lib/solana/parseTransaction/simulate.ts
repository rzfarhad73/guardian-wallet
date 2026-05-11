import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import type {
  AssetTransfer,
  ParsedTransactionFacts,
  SimulationAssetChange,
  SimulationBalanceChange,
  SimulationPermissionChange,
  SimulationResult
} from "../types";
import { SOLANA_RPC } from "../rpc";
import { LAMPORTS_PER_SOL, SPL_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "./constants";

function describeAddress(address?: string): string {
  if (!address) return "unknown";
  return address.length <= 12 ? address : `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function deriveAssetDirection(
  transfer: AssetTransfer,
  signerSet: Set<string>
): SimulationAssetChange["direction"] {
  const fromSigner = Boolean(transfer.from && signerSet.has(transfer.from));
  const toSigner = Boolean(transfer.to && signerSet.has(transfer.to));
  if (fromSigner && toSigner) return "internal";
  if (fromSigner) return "out";
  if (toSigner) return "in";
  return "unknown";
}

function buildSimulationAssetChanges(facts?: ParsedTransactionFacts): SimulationAssetChange[] {
  if (!facts) return [];
  const signerSet = new Set(facts.signerAddresses);
  return facts.transfers.map((transfer) => {
    const direction = deriveAssetDirection(transfer, signerSet);
    const amount = transfer.amount ?? "unknown amount";
    const assetLabel = transfer.mint ? `${transfer.assetType} (${transfer.mint})` : transfer.assetType;
    const directionLabel =
      direction === "out"
        ? "Outgoing"
        : direction === "in"
          ? "Incoming"
          : direction === "internal"
            ? "Internal"
            : "Observed";
    return {
      assetType: transfer.assetType,
      amount: transfer.amount,
      mint: transfer.mint,
      from: transfer.from,
      to: transfer.to,
      direction,
      description: `${directionLabel}: ${amount} ${assetLabel} from ${describeAddress(
        transfer.from
      )} to ${describeAddress(transfer.to)}`
    };
  });
}

function buildSimulationPermissionChanges(facts?: ParsedTransactionFacts): SimulationPermissionChange[] {
  if (!facts) return [];
  return [
    ...facts.approvals.map((approval) => ({
      type: "approval" as const,
      tokenAccount: approval.tokenAccount,
      delegate: approval.delegate,
      amount: approval.amount,
      mint: approval.mint,
      description: `Approval: ${describeAddress(approval.delegate)} can move up to ${
        approval.amount ?? "unknown"
      } tokens from ${describeAddress(approval.tokenAccount)}`
    })),
    ...facts.authorityChanges.map((change) => ({
      type: "authority-change" as const,
      account: change.account,
      newAuthority: change.newAuthority,
      authorityType: change.authorityType,
      description: `Authority change: ${change.authorityType ?? "authority"} on ${describeAddress(
        change.account
      )} becomes ${describeAddress(change.newAuthority)}`
    }))
  ];
}

function parsePublicKey(address: string): PublicKey | undefined {
  try {
    return new PublicKey(address);
  } catch {
    return undefined;
  }
}

function collectSimulationAccountAddresses(facts?: ParsedTransactionFacts): string[] {
  if (!facts) return [];
  const addresses = new Set<string>();
  const add = (address?: string) => {
    if (address && parsePublicKey(address)) addresses.add(address);
  };

  add(facts.feePayer);
  facts.signerAddresses.forEach(add);
  facts.instructions.forEach((instruction) => instruction.accounts?.forEach(add));
  facts.transfers.forEach((transfer) => {
    add(transfer.from);
    add(transfer.to);
  });
  facts.approvals.forEach((approval) => {
    add(approval.tokenAccount);
    add(approval.delegate);
  });
  facts.authorityChanges.forEach((change) => {
    add(change.account);
    add(change.oldAuthority);
    add(change.newAuthority);
  });

  return [...addresses].slice(0, 32);
}

type SimulatedAccount = {
  lamports?: number;
  data?: unknown;
  owner?: string;
};

type SnapshotAccount = {
  lamports: bigint;
  data?: Buffer;
  ownerProgram?: string;
};

function accountDataToBuffer(data: unknown): Buffer | undefined {
  if (!data) return undefined;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === "string") return Buffer.from(data, "base64");
  if (Array.isArray(data) && typeof data[0] === "string") {
    return Buffer.from(data[0], typeof data[1] === "string" ? (data[1] as BufferEncoding) : "base64");
  }
  return undefined;
}

function snapshotFromAccount(
  account: { lamports?: number; data?: unknown; owner?: string | PublicKey } | null | undefined
): SnapshotAccount {
  const rawOwner = account?.owner;
  const owner = typeof rawOwner === "string" ? rawOwner : rawOwner?.toBase58();
  return {
    lamports: BigInt(account?.lamports ?? 0),
    data: accountDataToBuffer(account?.data),
    ownerProgram: owner
  };
}

function decodeTokenAccount(
  account: SnapshotAccount
): { mint: string; owner: string; amount: bigint } | undefined {
  if (
    !account.data ||
    account.data.length < 165 ||
    (account.ownerProgram !== SPL_TOKEN_PROGRAM_ID && account.ownerProgram !== TOKEN_2022_PROGRAM_ID)
  ) {
    return undefined;
  }
  try {
    return {
      mint: new PublicKey(account.data.subarray(0, 32)).toBase58(),
      owner: new PublicKey(account.data.subarray(32, 64)).toBase58(),
      amount: account.data.readBigUInt64LE(64)
    };
  } catch {
    return undefined;
  }
}

function formatSignedAmount(value: bigint, divisor = 1): string {
  const sign = value < 0n ? "-" : "+";
  const abs = value < 0n ? -value : value;
  if (divisor === 1) return `${sign}${abs.toString()}`;
  const whole = abs / BigInt(divisor);
  const fraction = (abs % BigInt(divisor)).toString().padStart(Math.log10(divisor), "0").replace(/0+$/, "");
  return fraction ? `${sign}${whole.toString()}.${fraction}` : `${sign}${whole.toString()}`;
}

function formatAmount(value: bigint, divisor = 1): string {
  if (divisor === 1) return value.toString();
  const whole = value / BigInt(divisor);
  const fraction = (value % BigInt(divisor)).toString().padStart(Math.log10(divisor), "0").replace(/0+$/, "");
  return fraction ? `${whole.toString()}.${fraction}` : whole.toString();
}

/**
 * Build SOL + SPL token balance changes from pre/post account snapshots.
 *
 * Pre-accounts and post-accounts may come from different RPC slots due to the
 * time gap between fetchPreSimulationAccounts and simulateTransaction. For
 * recipient-only addresses (not a signer or fee-payer) this can produce a
 * negative SOL delta entirely unrelated to the transaction — those are dropped.
 */
function buildBalanceChanges(
  addresses: string[],
  preAccounts: SnapshotAccount[],
  postAccounts?: Array<SimulatedAccount | null> | null,
  signerAddresses: Set<string> = new Set()
): SimulationBalanceChange[] {
  if (!postAccounts?.length) return [];

  const changes: SimulationBalanceChange[] = [];
  addresses.forEach((address, index) => {
    const pre = preAccounts[index] ?? snapshotFromAccount(undefined);
    const post = snapshotFromAccount(postAccounts[index]);
    const preToken = decodeTokenAccount(pre);
    const postToken = decodeTokenAccount(post);
    const token = postToken ?? preToken;

    if (token && preToken?.amount !== postToken?.amount) {
      const preAmount = preToken?.amount ?? 0n;
      const postAmount = postToken?.amount ?? 0n;
      const delta = postAmount - preAmount;
      changes.push({
        assetType: "SPL",
        account: address,
        mint: token.mint,
        owner: token.owner,
        preAmount: formatAmount(preAmount),
        postAmount: formatAmount(postAmount),
        change: formatSignedAmount(delta),
        description: `Token balance ${formatSignedAmount(delta)} on ${describeAddress(address)}`
      });
    }

    if (!token && pre.lamports !== post.lamports) {
      const delta = post.lamports - pre.lamports;
      // For non-signer recipient accounts the pre/post snapshots may have been
      // taken at different RPC slots, causing a spurious negative delta that has
      // nothing to do with this transaction. Drop those entries.
      if (delta < 0n && !signerAddresses.has(address)) {
        return;
      }
      changes.push({
        assetType: "SOL",
        account: address,
        preAmount: formatAmount(pre.lamports, LAMPORTS_PER_SOL),
        postAmount: formatAmount(post.lamports, LAMPORTS_PER_SOL),
        change: formatSignedAmount(delta, LAMPORTS_PER_SOL),
        description: `SOL balance ${formatSignedAmount(delta, LAMPORTS_PER_SOL)} on ${describeAddress(address)}`
      });
    }
  });

  return changes;
}

async function fetchPreSimulationAccounts(
  connection: Connection,
  addresses: string[]
): Promise<SnapshotAccount[]> {
  if (!addresses.length) return [];
  const publicKeys = addresses.map((address) => new PublicKey(address));
  const accounts = await connection.getMultipleAccountsInfo(publicKeys);
  return accounts.map(snapshotFromAccount);
}

function buildSimulationResult(
  facts: ParsedTransactionFacts | undefined,
  wouldSucceed: boolean,
  error?: string,
  logs?: string[] | null,
  balanceChanges: SimulationBalanceChange[] = []
): SimulationResult {
  return {
    wouldSucceed,
    error,
    logs: logs?.slice(0, 20) ?? [],
    balanceChanges,
    assetChanges: buildSimulationAssetChanges(facts),
    permissionChanges: buildSimulationPermissionChanges(facts)
  };
}

function formatSimError(err: unknown): string {
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}

export async function simulateBase64Transaction(
  base64: string,
  facts?: ParsedTransactionFacts
): Promise<SimulationResult | undefined> {
  try {
    const bytes = Buffer.from(base64, "base64");
    const connection = new Connection(SOLANA_RPC, "confirmed");

    const doSim = async (): Promise<SimulationResult> => {
      const accountAddresses = collectSimulationAccountAddresses(facts);
      const signerSet = new Set([
        ...(facts?.signerAddresses ?? []),
        ...(facts?.feePayer ? [facts.feePayer] : [])
      ]);

      const preAccounts = accountAddresses.length
        ? await fetchPreSimulationAccounts(connection, accountAddresses).catch(() =>
            accountAddresses.map(() => snapshotFromAccount(undefined))
          )
        : [];

      const simulationConfig = {
        sigVerify: false,
        replaceRecentBlockhash: true,
        ...(accountAddresses.length
          ? { accounts: { encoding: "base64" as const, addresses: accountAddresses } }
          : {})
      };

      try {
        const vtx = VersionedTransaction.deserialize(bytes);
        const result = await connection.simulateTransaction(vtx, simulationConfig);
        return buildSimulationResult(
          facts,
          result.value.err === null,
          result.value.err === null ? undefined : formatSimError(result.value.err),
          result.value.logs,
          buildBalanceChanges(accountAddresses, preAccounts, result.value.accounts, signerSet)
        );
      } catch {
        const tx = Transaction.from(bytes);
        const result = await connection.simulateTransaction(tx as never, simulationConfig as never);
        return buildSimulationResult(
          facts,
          result.value.err === null,
          result.value.err === null ? undefined : formatSimError(result.value.err),
          result.value.logs,
          buildBalanceChanges(accountAddresses, preAccounts, result.value.accounts, signerSet)
        );
      }
    };

    const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5000));
    return await Promise.race([doSim(), timeout]);
  } catch {
    return undefined;
  }
}
