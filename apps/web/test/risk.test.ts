import { describe, expect, it } from "vitest";
import { parseGuardianJson } from "@/lib/risk/explanationPrompt";
import { checkIntent } from "@/lib/risk/intentCheck";
import { evaluateScamText } from "@/lib/risk/scamSignals";
import { evaluateGuardianPolicy, normalizeGuardianPolicy } from "@/lib/risk/policy";
import { riskLevelFromScore, scoreFindings } from "@/lib/risk/scoreRisk";
import { cosineSimilarity } from "@/lib/qvac/vector";
import { evaluateTransactionRisk } from "@/lib/solana/riskRules";
import { evaluateWalletRisk } from "@/lib/solana/walletRisk";
import { parseBase64Transaction, parseTransactionInput } from "@/lib/solana/parseTransaction";
import type { ParsedTransactionFacts, WalletProfileFacts } from "@/lib/solana/types";

const suspiciousTokenApproval: ParsedTransactionFacts = {
  signerAddresses: [],
  programs: [{ programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", label: "SPL Token", known: true }],
  instructions: [],
  transfers: [],
  approvals: [{ delegate: "EvilAddress111111111111111111111111111111111", amount: "1000000000" }],
  authorityChanges: [],
  unknownInstructions: [],
  summaryFacts: ["Token delegate approval granting full token balance to unknown address."]
};

describe("risk scoring", () => {
  it("maps score bands to risk levels", () => {
    expect(riskLevelFromScore(0)).toBe("Low");
    expect(riskLevelFromScore(25)).toBe("Medium");
    expect(riskLevelFromScore(50)).toBe("High");
    expect(riskLevelFromScore(80)).toBe("Critical");
  });

  it("detects suspicious token approvals", () => {
    const assessment = scoreFindings(evaluateTransactionRisk(suspiciousTokenApproval));
    expect(assessment.level).toBe("High");
    expect(assessment.findings.some((finding) => finding.id === "token-approval")).toBe(true);
  });

  it("detects seed phrase scam text", () => {
    const findings = evaluateScamText("Validate your wallet by entering your recovery phrase.");
    expect(findings.some((finding) => finding.id === "seed-phrase-request")).toBe(true);
    expect(scoreFindings(findings).level).toBe("Critical");
  });
});

describe("guardian policy engine", () => {
  const baseFacts: ParsedTransactionFacts = {
    signerAddresses: ["Owner111"],
    programs: [],
    instructions: [],
    transfers: [],
    approvals: [],
    authorityChanges: [],
    unknownInstructions: [],
    summaryFacts: []
  };

  it("normalizes stricter DAO defaults", () => {
    const policy = normalizeGuardianPolicy({ mode: "dao" });
    expect(policy.blockUnknownPrograms).toBe(true);
    expect(policy.maxSolTransfer).toBe(2);
  });

  it("flags delegate approvals when policy blocks them", () => {
    const findings = evaluateGuardianPolicy(
      {
        ...baseFacts,
        approvals: [{ tokenAccount: "TokenAcc", delegate: "Delegate111", amount: "1000" }]
      },
      normalizeGuardianPolicy({ blockDelegateApprovals: true })
    );
    expect(findings.some((finding) => finding.id === "policy-block-delegate-approval")).toBe(true);
  });

  it("flags outgoing SOL above the policy limit", () => {
    const findings = evaluateGuardianPolicy(
      {
        ...baseFacts,
        transfers: [{ assetType: "SOL", amount: "3", from: "Owner111", to: "Recipient111" }]
      },
      normalizeGuardianPolicy({ maxSolTransfer: 2 })
    );
    expect(findings.some((finding) => finding.id === "policy-max-sol-transfer")).toBe(true);
  });
});

describe("rag helpers", () => {
  it("orders related vectors above unrelated vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeGreaterThan(cosineSimilarity([1, 0, 0], [0, 1, 0]));
  });
});

describe("guardian json parser", () => {
  it("falls back safely for malformed LLM output", () => {
    const parsed = parseGuardianJson("plain text explanation", "High");
    expect(parsed.riskLevel).toBe("High");
    expect(parsed.confidence).toBe("Low");
    expect(parsed.plainEnglishExplanation).toContain("plain text");
  });
});

describe("wallet risk rules", () => {
  const baseWallet: WalletProfileFacts = {
    address: "11111111111111111111111111111111",
    solBalance: 1.5,
    tokenAccounts: [],
    recentTransactionCount: 0,
    fetchedAt: new Date().toISOString()
  };

  it("detects active token delegate as high severity", () => {
    const facts: WalletProfileFacts = {
      ...baseWallet,
      tokenAccounts: [
        {
          address: "TokenAccAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          mint: "MintAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          balance: 100,
          delegate: "EvilAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        }
      ]
    };
    const findings = evaluateWalletRisk(facts);
    expect(findings.some((f) => f.id === "active-token-delegate")).toBe(true);
    expect(findings.find((f) => f.id === "active-token-delegate")?.severity).toBe("high");
  });

  it("detects dust/spam tokens when 5 or more zero-balance accounts exist", () => {
    const facts: WalletProfileFacts = {
      ...baseWallet,
      tokenAccounts: Array.from({ length: 6 }, (_, i) => ({
        address: `TokenAcc${i}AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
        mint: `DustMint${i}AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
        balance: 0
      }))
    };
    const findings = evaluateWalletRisk(facts);
    expect(findings.some((f) => f.id === "dust-spam-tokens")).toBe(true);
  });

  it("does not flag dust rule when fewer than 5 dust accounts", () => {
    const facts: WalletProfileFacts = {
      ...baseWallet,
      tokenAccounts: Array.from({ length: 3 }, (_, i) => ({
        address: `TokenAcc${i}AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
        mint: `DustMint${i}AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
        balance: 0
      }))
    };
    const findings = evaluateWalletRisk(facts);
    expect(findings.some((f) => f.id === "dust-spam-tokens")).toBe(false);
  });
});

describe("checkIntent", () => {
  const baseFacts: ParsedTransactionFacts = {
    signerAddresses: [],
    programs: [],
    instructions: [],
    transfers: [],
    approvals: [],
    authorityChanges: [],
    unknownInstructions: [],
    summaryFacts: []
  };

  const withDelegate: ParsedTransactionFacts = {
    ...baseFacts,
    approvals: [{ delegate: "EvilAddress111111111111111111111111111111111", amount: "1000000000" }]
  };

  const withAuthorityChange: ParsedTransactionFacts = {
    ...baseFacts,
    authorityChanges: [
      {
        account: "TokenAcc1111111111111111111111111111111111111",
        newAuthority: "Attacker1111111111111111111111111111111111"
      }
    ]
  };

  const withSingleTransfer: ParsedTransactionFacts = {
    ...baseFacts,
    transfers: [
      {
        assetType: "SOL" as const,
        from: "Sender111",
        to: "Receiver111",
        amount: "1000000",
        mint: "So11111111111111111111111111111111111111112"
      }
    ]
  };

  const withFourTransfers: ParsedTransactionFacts = {
    ...baseFacts,
    transfers: Array.from({ length: 4 }, (_, i) => ({
      assetType: "SPL" as const,
      from: `From${i}`,
      to: `To${i}`,
      amount: "100",
      mint: `Mint${i}`
    }))
  };

  it("returns critical_mismatch when claiming but transaction approves a delegate", () => {
    const result = checkIntent("Claim my airdrop reward", withDelegate);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns critical_mismatch when claiming but transaction changes authority", () => {
    const result = checkIntent("Claim free tokens", withAuthorityChange);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns critical_mismatch when connecting but transaction approves a delegate", () => {
    const result = checkIntent("Connect my wallet to verify", withDelegate);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns critical_mismatch when connecting but transaction changes authority", () => {
    const result = checkIntent("Login to validate account", withAuthorityChange);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns critical_mismatch when swapping but transaction approves a delegate", () => {
    const result = checkIntent("Swap 100 USDC for SOL", withDelegate);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns partial_mismatch when swap moves more than 3 assets", () => {
    const result = checkIntent("Swap my tokens", withFourTransfers);
    expect(result.verdict).toBe("partial_mismatch");
  });

  it("returns partial_mismatch when staking but transaction approves a delegate", () => {
    const result = checkIntent("Stake my SOL", withDelegate);
    expect(result.verdict).toBe("partial_mismatch");
  });

  it("returns critical_mismatch when sending but transaction approves a delegate", () => {
    const result = checkIntent("Send 1 SOL to my friend", withDelegate);
    expect(result.verdict).toBe("critical_mismatch");
  });

  it("returns match when sending and there is exactly one transfer", () => {
    const result = checkIntent("Transfer tokens to my friend", withSingleTransfer);
    expect(result.verdict).toBe("match");
  });

  it("returns unclear when intent cannot be matched", () => {
    const result = checkIntent("Do something with my wallet", baseFacts);
    expect(result.verdict).toBe("unclear");
  });

  it("includes declared intent in the result", () => {
    const result = checkIntent("Claim my airdrop", withDelegate);
    expect(result.declaredIntent).toBe("Claim my airdrop");
  });

  it("includes a non-empty reason in the result", () => {
    const result = checkIntent("Claim my airdrop", withDelegate);
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe("parseTransactionInput — input validation", () => {
  it("throws on empty string", () => {
    expect(() => parseTransactionInput("")).toThrow();
  });

  it("throws a descriptive error for a Solana wallet address", () => {
    expect(() => parseTransactionInput("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM")).toThrow(
      /wallet or token address/
    );
  });

  it("throws a descriptive error for an Ethereum address", () => {
    expect(() => parseTransactionInput("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4")).toThrow(/Ethereum/);
  });

  it("throws a descriptive error for a Bitcoin bech32 address", () => {
    expect(() => parseTransactionInput("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toThrow(/Bitcoin/);
  });

  it("throws a descriptive error for a Solana transaction signature (87-88 chars)", () => {
    // 88-char base58 string that looks like a signature
    const sig = "5KtPn3DXXzHkb66TT1PmMBR7XL7Ey6SHXKgVtWe6tGPBiS3N7oL9vWqCbpME5r7YZkKmXfUg3NqRzPHwLdRXkBM";
    expect(() => parseTransactionInput(sig)).toThrow(/signature/);
  });

  it("throws on malformed base64 that is not a wallet address", () => {
    expect(() => parseTransactionInput("!!!not-base64!!!")).toThrow();
  });

  it("passes through a ParsedTransactionFacts object unchanged", () => {
    const facts: ParsedTransactionFacts = {
      signerAddresses: [],
      programs: [],
      instructions: [],
      transfers: [],
      approvals: [],
      authorityChanges: [],
      unknownInstructions: [],
      summaryFacts: []
    };
    expect(parseTransactionInput(facts)).toBe(facts);
  });
});

import { Transaction, TransactionInstruction, PublicKey, SystemProgram } from "@solana/web3.js";

const OWNER = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
const RECIPIENT = new PublicKey("DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH");
const DELEGATE = new PublicKey("Hacker11111111111111111111111111111111111111");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const FAKE_BLOCKHASH = "11111111111111111111111111111111";

function makeTxBase64(instruction: TransactionInstruction): string {
  const tx = new Transaction();
  tx.feePayer = OWNER;
  tx.recentBlockhash = FAKE_BLOCKHASH;
  tx.add(instruction);
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

const SOL_HIGH_VALUE_TX = makeTxBase64(
  SystemProgram.transfer({ fromPubkey: OWNER, toPubkey: RECIPIENT, lamports: 10_000_000_000 })
);

const SOL_DUST_TX = makeTxBase64(
  SystemProgram.transfer({ fromPubkey: OWNER, toPubkey: RECIPIENT, lamports: 500_000 })
);

const SPL_APPROVE_TX = (() => {
  const data = Buffer.alloc(9);
  data.writeUInt8(4, 0);
  data.writeBigUInt64LE(BigInt("1000000000"), 1);
  return makeTxBase64(
    new TransactionInstruction({
      programId: TOKEN_PROGRAM,
      keys: [
        { pubkey: RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: DELEGATE, isSigner: false, isWritable: false },
        { pubkey: OWNER, isSigner: true, isWritable: false }
      ],
      data
    })
  );
})();

const SPL_SET_AUTH_TX = (() => {
  const data = Buffer.alloc(35);
  data.writeUInt8(26, 0); // SetAuthority instruction
  data.writeUInt8(2, 1); // AccountOwner type
  data.writeUInt8(1, 2); // hasNewAuthority = true
  DELEGATE.toBuffer().copy(data, 3);
  return makeTxBase64(
    new TransactionInstruction({
      programId: TOKEN_PROGRAM,
      keys: [
        { pubkey: RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: OWNER, isSigner: true, isWritable: false }
      ],
      data
    })
  );
})();

describe("parseBase64Transaction — SOL transfer decoding", () => {
  it("decodes a high-value SOL transfer (10 SOL) into transfers[]", () => {
    const facts = parseBase64Transaction(SOL_HIGH_VALUE_TX);
    expect(facts.transfers).toHaveLength(1);
    expect(facts.transfers[0].assetType).toBe("SOL");
    expect(Number(facts.transfers[0].amount)).toBe(10);
  });

  it("decodes a dust SOL transfer with amount < 0.001 SOL", () => {
    const facts = parseBase64Transaction(SOL_DUST_TX);
    expect(facts.transfers).toHaveLength(1);
    expect(Number(facts.transfers[0].amount)).toBeLessThan(0.001);
  });

  it("sets correct from and to addresses", () => {
    const facts = parseBase64Transaction(SOL_HIGH_VALUE_TX);
    expect(facts.transfers[0].from).toBe(OWNER.toBase58());
    expect(facts.transfers[0].to).toBe(RECIPIENT.toBase58());
  });

  it("produces no approvals or authorityChanges for a plain SOL transfer", () => {
    const facts = parseBase64Transaction(SOL_HIGH_VALUE_TX);
    expect(facts.approvals).toHaveLength(0);
    expect(facts.authorityChanges).toHaveLength(0);
  });
});

describe("parseBase64Transaction — SPL Token decoding", () => {
  it("decodes SPL Token Approve into approvals[]", () => {
    const facts = parseBase64Transaction(SPL_APPROVE_TX);
    expect(facts.approvals).toHaveLength(1);
    expect(facts.approvals[0].delegate).toBe(DELEGATE.toBase58());
    expect(facts.approvals[0].amount).toBe("1000000000");
  });

  it("decodes SPL Token SetAuthority into authorityChanges[]", () => {
    const facts = parseBase64Transaction(SPL_SET_AUTH_TX);
    expect(facts.authorityChanges).toHaveLength(1);
    expect(facts.authorityChanges[0].authorityType).toBe("AccountOwner");
    expect(facts.authorityChanges[0].account).toBe(RECIPIENT.toBase58());
  });

  it("decodes SetAuthority newAuthority as a base58 address (not hex)", () => {
    const facts = parseBase64Transaction(SPL_SET_AUTH_TX);
    const newAuth = facts.authorityChanges[0].newAuthority;
    // base58 addresses are 32-44 chars; hex of 32 bytes would be exactly 64 chars
    expect(newAuth).toBe(DELEGATE.toBase58());
    expect(newAuth?.length).toBeLessThan(50);
  });

  it("does not produce transfers for a token approve instruction", () => {
    const facts = parseBase64Transaction(SPL_APPROVE_TX);
    expect(facts.transfers).toHaveLength(0);
  });

  it("decodes Token-2022 ApproveChecked (ix 13) into approvals[]", () => {
    // Build a Token-2022 ApproveChecked transaction
    const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPQj8XDPxQhR8Qo9b8r1");
    const approveCheckedData = Buffer.alloc(10);
    approveCheckedData.writeUInt8(13, 0); // ApproveChecked
    approveCheckedData.writeBigUInt64LE(BigInt("500000000"), 1);
    approveCheckedData.writeUInt8(6, 9); // 6 decimals
    const approveCheckedTx = makeTxBase64(
      new TransactionInstruction({
        programId: TOKEN_2022,
        keys: [
          { pubkey: RECIPIENT, isSigner: false, isWritable: true }, // tokenAccount
          { pubkey: OWNER, isSigner: false, isWritable: false }, // mint
          { pubkey: DELEGATE, isSigner: false, isWritable: false }, // delegate
          { pubkey: OWNER, isSigner: true, isWritable: false } // owner
        ],
        data: approveCheckedData
      })
    );
    const facts = parseBase64Transaction(approveCheckedTx);
    expect(facts.approvals).toHaveLength(1);
    expect(facts.approvals[0].delegate).toBe(DELEGATE.toBase58());
    expect(facts.approvals[0].amount).toBe("500000000");
  });
});

describe("evaluateTransactionRisk — additional rules", () => {
  const base: ParsedTransactionFacts = {
    signerAddresses: [],
    programs: [],
    instructions: [],
    transfers: [],
    approvals: [],
    authorityChanges: [],
    unknownInstructions: [],
    summaryFacts: []
  };

  it("flags authority-change as critical", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      authorityChanges: [{ account: "Acct1", newAuthority: "Attacker", authorityType: "AccountOwner" }]
    };
    const findings = evaluateTransactionRisk(facts);
    const f = findings.find((x) => x.id === "authority-change");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("critical");
  });

  it("flags high-value SOL transfer (10 SOL >= threshold of 5 SOL)", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [{ assetType: "SOL", amount: "10", from: "A", to: "B" }]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "high-value-transfer")).toBe(true);
  });

  it("does not flag high-value rule for 1 SOL", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [{ assetType: "SOL", amount: "1", from: "A", to: "B" }]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "high-value-transfer")).toBe(false);
  });

  it("flags high-value SPL transfer (1000+ tokens)", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [{ assetType: "SPL", amount: "5000", from: "A", to: "B", mint: "MintXXX" }]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "high-value-transfer")).toBe(true);
  });

  it("flags multiple-assets when 2+ transfers co-occur with an approval", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [
        { assetType: "SPL", amount: "100", from: "A", to: "B", mint: "Mint1" },
        { assetType: "SPL", amount: "200", from: "A", to: "C", mint: "Mint2" }
      ],
      approvals: [{ delegate: "DrainAddr", amount: "999" }]
    };
    const findings = evaluateTransactionRisk(facts, "pre-sign");
    expect(findings.some((f) => f.id === "multiple-assets")).toBe(true);
  });

  it("does NOT flag multiple-assets on a plain 2-asset swap without approvals", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [
        { assetType: "SPL", amount: "100", from: "A", to: "B", mint: "Mint1" },
        { assetType: "SPL", amount: "200", from: "A", to: "C", mint: "Mint2" }
      ]
    };
    const findings = evaluateTransactionRisk(facts, "pre-sign");
    expect(findings.some((f) => f.id === "multiple-assets")).toBe(false);
  });

  it("does NOT flag multiple-assets in passive recipient context", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [
        { assetType: "SPL", amount: "100", from: "A", to: "B", mint: "Mint1" },
        { assetType: "SPL", amount: "200", from: "A", to: "C", mint: "Mint2" }
      ]
    };
    const findings = evaluateTransactionRisk(facts, "recipient");
    expect(findings.some((f) => f.id === "multiple-assets")).toBe(false);
  });

  it("does NOT flag multiple-assets for dust-only SOL transfers", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: [
        { assetType: "SOL", amount: "0.0001", from: "A", to: "R1" },
        { assetType: "SOL", amount: "0.0002", from: "A", to: "R2" }
      ]
    };
    const findings = evaluateTransactionRisk(facts, "pre-sign");
    expect(findings.some((f) => f.id === "multiple-assets")).toBe(false);
  });

  it("flags scatter-transfer for 5+ transfers to 4+ unique recipients", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: Array.from({ length: 6 }, (_, i) => ({
        assetType: "SOL" as const,
        amount: "0.001",
        from: "Sender",
        to: `Recipient${i}`
      }))
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "scatter-transfer")).toBe(true);
  });

  it("does NOT flag scatter-transfer for 4 transfers", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      transfers: Array.from({ length: 4 }, (_, i) => ({
        assetType: "SOL" as const,
        amount: "0.001",
        from: "Sender",
        to: `Recipient${i}`
      }))
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "scatter-transfer")).toBe(false);
  });

  it("flags suspicious-text when instruction description contains scam keywords", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      instructions: [
        {
          programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
          type: "compiledInstruction",
          description: "Memo: validate your wallet now to claim your airdrop",
          accounts: []
        }
      ]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "suspicious-text")).toBe(true);
  });

  it("flags suspicious-text when scam keywords appear in memoText directly", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      memoText: "urgent: restore your wallet using your seed phrase"
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "suspicious-text")).toBe(true);
  });

  it("includes the memoText in suspicious-text evidence", () => {
    const memo = "validate your private key now";
    const facts: ParsedTransactionFacts = {
      ...base,
      memoText: memo
    };
    const findings = evaluateTransactionRisk(facts);
    const finding = findings.find((f) => f.id === "suspicious-text");
    expect(finding?.evidence).toContain(memo);
  });

  it("flags spam-bot-memo for volume bot text in memoText field", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      memoText: "volume bot — 100k daily trades — free trial"
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "spam-bot-memo")).toBe(true);
  });

  it("elevates unknown program to critical when combined with an approval", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      programs: [{ programId: "UnknownDrainer111111111111111111111111111", known: false }],
      unknownInstructions: [{ programId: "UnknownDrainer111111111111111111111111111", type: "unknown" }],
      approvals: [{ delegate: "Attacker", amount: "999" }]
    };
    const findings = evaluateTransactionRisk(facts);
    const unknownFinding = findings.find((f) => f.id === "unknown-program");
    expect(unknownFinding?.severity).toBe("critical");
    expect(unknownFinding?.scoreImpact).toBe(80);
  });
});

describe("scoreFindings — edge cases", () => {
  it("caps total score at 100 when multiple high-impact findings stack", () => {
    const findings: ReturnType<typeof evaluateTransactionRisk> = [
      { id: "a", title: "A", severity: "critical", scoreImpact: 80, explanation: "", evidence: [] },
      { id: "b", title: "B", severity: "critical", scoreImpact: 60, explanation: "", evidence: [] }
    ];
    expect(scoreFindings(findings).score).toBe(100);
  });

  it("does not count low-severity findings in deterministicSummary warning count", () => {
    // A simple 1 SOL transfer only produces the low-severity informational finding
    const facts: ParsedTransactionFacts = {
      signerAddresses: [],
      programs: [{ programId: "11111111111111111111111111111111", label: "System Program", known: true }],
      instructions: [],
      transfers: [{ assetType: "SOL", amount: "1", from: "A", to: "B" }],
      approvals: [],
      authorityChanges: [],
      unknownInstructions: [],
      summaryFacts: []
    };
    const assessment = scoreFindings(evaluateTransactionRisk(facts));
    // Low-severity findings are acknowledged but not counted as "warning signs"
    expect(assessment.deterministicSummary).toMatch(
      /No high-severity warning signs found \(\d+ low-severity notes?\)\.|No deterministic warning signs found\./
    );
  });

  it("reports correct warning count for non-low findings", () => {
    const findings: ReturnType<typeof evaluateTransactionRisk> = [
      { id: "a", title: "A", severity: "high", scoreImpact: 50, explanation: "", evidence: [] },
      { id: "b", title: "B", severity: "low", scoreImpact: 0, explanation: "", evidence: [] },
      { id: "c", title: "C", severity: "medium", scoreImpact: 20, explanation: "", evidence: [] }
    ];
    const assessment = scoreFindings(findings);
    // Only 'a' and 'c' are non-low → 2 warning signs
    expect(assessment.deterministicSummary).toContain("2");
  });
});

describe("edge case hardening", () => {
  const emptyFacts: ParsedTransactionFacts = {
    signerAddresses: [],
    programs: [],
    instructions: [],
    transfers: [],
    approvals: [],
    authorityChanges: [],
    unknownInstructions: [],
    summaryFacts: []
  };

  it("flags 0-instruction transaction as medium risk", () => {
    const findings = evaluateTransactionRisk(emptyFacts);
    const noInst = findings.find((f) => f.id === "no-instructions");
    expect(noInst).toBeDefined();
    expect(noInst?.severity).toBe("medium");
    expect(noInst?.scoreImpact).toBe(20);
  });

  it("negative amount string does not trigger high-value-transfer", () => {
    const facts: ParsedTransactionFacts = {
      ...emptyFacts,
      programs: [{ programId: "11111111111111111111111111111111", label: "System Program", known: true }],
      transfers: [{ assetType: "SOL", amount: "-10", from: "A", to: "B" }]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.find((f) => f.id === "high-value-transfer")).toBeUndefined();
  });

  it("checkIntent clamps very long userIntent strings", () => {
    const longIntent = "claim ".repeat(200); // 1200 chars
    const result = checkIntent(longIntent, emptyFacts);
    expect(result.declaredIntent.length).toBeLessThanOrEqual(500);
  });

  it("evaluateScamText truncates huge input without crashing", () => {
    const bigText = "connect wallet ".repeat(1000) + " claim airdrop"; // ~15 000 chars
    const findings = evaluateScamText(bigText);
    expect(Array.isArray(findings)).toBe(true);
  });

  it("never-funded wallet with delegate is flagged critical", () => {
    const facts: WalletProfileFacts = {
      address: "TestAddr",
      solBalance: 0,
      tokenAccounts: [
        {
          address: "TokenAccount1",
          mint: "TokenMint",
          balance: 0,
          delegate: "DrainerAddr",
          delegatedAmount: 1e9
        }
      ],
      recentTransactionCount: 0,
      neverFunded: true,
      fetchedAt: new Date().toISOString()
    };
    const findings = evaluateWalletRisk(facts);
    const neverFunded = findings.find((f) => f.id === "never-funded");
    const delegate = findings.find((f) => f.id === "active-token-delegate");
    expect(neverFunded).toBeDefined();
    expect(delegate).toBeDefined();
    expect(delegate?.severity).toBe("critical");
    expect(delegate?.scoreImpact).toBe(60);
  });
});

describe("pump.fun risk rules", () => {
  const base: ParsedTransactionFacts = {
    signerAddresses: [],
    programs: [],
    instructions: [],
    transfers: [],
    approvals: [],
    authorityChanges: [],
    unknownInstructions: [],
    summaryFacts: []
  };

  it("flags Pump.fun program + authority change as high severity", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      programs: [
        { programId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", label: "Pump.fun", known: true }
      ],
      authorityChanges: [
        {
          account: "TokenAcc1111111111111111111111111111111111111",
          newAuthority: "Attacker1111111111111111111111111111111111",
          authorityType: "MintTokens"
        }
      ]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "pumpfun-authority-change")).toBe(true);
    expect(findings.find((f) => f.id === "pumpfun-authority-change")?.severity).toBe("high");
  });

  it("does not flag Pump.fun without authority change", () => {
    const facts: ParsedTransactionFacts = {
      ...base,
      programs: [
        { programId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", label: "Pump.fun", known: true }
      ],
      transfers: [{ assetType: "SOL" as const, amount: "0.001", from: "Sender111", to: "Receiver111" }]
    };
    const findings = evaluateTransactionRisk(facts);
    expect(findings.some((f) => f.id === "pumpfun-authority-change")).toBe(false);
  });
});
