const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX = /^0x[0-9a-fA-F]+$/;

export default async function balance(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const wallet = req.query?.wallet;
  if (typeof wallet !== "string" || !ADDRESS.test(wallet)) {
    return res.status(400).json({ error: "invalid_wallet" });
  }

  const rpcUrl = process.env.CITV_RPC_URL;
  const tokenAddress = process.env.CITV_TOKEN_ADDRESS;
  const decimals = Number(process.env.CITV_TOKEN_DECIMALS ?? 18);
  if (!rpcUrl || !ADDRESS.test(tokenAddress || "") || !Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    return res.status(503).json({ error: "balance_unavailable" });
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{
          to: tokenAddress,
          data: `0x70a08231${wallet.slice(2).toLowerCase().padStart(64, "0")}`,
        }, "latest"],
      }),
    });
    if (!response.ok) throw new Error("rpc_error");
    const payload = await response.json();
    if (payload.error || typeof payload.result !== "string" || !HEX.test(payload.result)) {
      throw new Error("invalid_rpc_response");
    }
    const balance = Number(BigInt(payload.result)) / 10 ** decimals;
    if (!Number.isFinite(balance)) throw new Error("invalid_balance");
    return res.status(200).json({ balance });
  } catch {
    return res.status(502).json({ error: "balance_unavailable" });
  }
}
