const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

export async function getSolPriceUsd() {
  const res = await fetch(COINGECKO_API);
  const data = await res.json();
  return data?.solana?.usd ?? null;
}
