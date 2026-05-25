declare global {
  interface Window { ethereum?: any }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
const RECIPIENT = "0x8069408a17B77895cb7Cd0B0D804aB46f59Bc4c3";
const BASE_CHAIN_ID = "0x2105"; // 8453
const PRICE_WEI = "0x71AFD498D0000"; // 0.002 ETH ≈ $5

export const FREE_LIMIT = 3;

function monthKey() {
  return `squint_free_${new Date().toISOString().slice(0, 7)}`;
}

export function getFreeUsed(): number {
  return parseInt(localStorage.getItem(monthKey()) ?? "0", 10);
}

export function incrementFreeUsed(): void {
  localStorage.setItem(monthKey(), String(getFreeUsed() + 1));
}

export async function sendPayment(onStatus: (s: string) => void): Promise<string> {
  const eth = window.ethereum;
  if (!eth) throw new Error("MetaMask not installed. Visit metamask.io to get it.");

  onStatus("Connecting wallet…");
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });

  onStatus("Switching to Base…");
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: "Base",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
        }],
      });
    } else {
      throw err;
    }
  }

  onStatus("Confirm in MetaMask…");
  const txHash: string = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from: accounts[0], to: RECIPIENT, value: PRICE_WEI }],
  });

  onStatus("Waiting for confirmation…");
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const receipt = await eth.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (receipt?.status === "0x1") return txHash;
    if (receipt?.status === "0x0") throw new Error("Transaction failed on-chain.");
  }
  throw new Error("Transaction not confirmed after 3 minutes.");
}

export async function verifyPayment(txHash: string): Promise<string> {
  const res = await fetch(`${API_BASE}/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_hash: txHash }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Payment verification failed.");
  }
  const data = await res.json();
  return data.token as string;
}
