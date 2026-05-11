import Address from "./Address";
import Facts from "./Facts";
import type { WalletResult } from "../types";

type Props = {
  address: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  isValidAddress: boolean;
  result?: WalletResult;
  onAddressChange: (val: string) => void;
  onAnalyze: () => void;
  onRetry: () => void;
};

export default function Input({
  address,
  loading,
  error,
  statusCode,
  isValidAddress,
  result,
  onAddressChange,
  onAnalyze,
  onRetry
}: Props) {
  return (
    <section className="min-w-0 space-y-6">
      <Address
        address={address}
        loading={loading}
        error={error}
        statusCode={statusCode}
        isValidAddress={isValidAddress}
        onAddressChange={onAddressChange}
        onAnalyze={onAnalyze}
        onRetry={onRetry}
      />
      {loading || result ? <Facts facts={result?.facts} loading={loading} /> : null}
    </section>
  );
}
