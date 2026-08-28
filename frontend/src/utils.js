import { ethers } from "ethers";

// wei (bigint) -> stringa "1.5" ETH
export function toEth(wei) {
  return ethers.formatEther(wei);
}

// Accorcia un indirizzo: 0x1234...abcd
export function shortAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Stato di una campagna in base a tempo e fondi raccolti.
// Ritorna: "active" | "succeeded" | "failed"
export function campaignStatus(campaign) {
  const now = Math.floor(Date.now() / 1000);
  const expired = now >= Number(campaign.deadline);
  const goalReached = campaign.raised >= campaign.goal;

  if (!expired) return "active";
  return goalReached ? "succeeded" : "failed";
}

// Etichetta leggibile dello stato.
export function statusLabel(status) {
  switch (status) {
    case "active": return "In corso";
    case "succeeded": return "Riuscita";
    case "failed": return "Fallita";
    default: return "";
  }
}

// Percentuale di completamento (0-100), limitata a 100.
export function progressPercent(campaign) {
  if (campaign.goal === 0n) return 0;
  const pct = Number((campaign.raised * 100n) / campaign.goal);
  return Math.min(pct, 100);
}

// Trasforma i secondi rimanenti in "2g 5h 30m 10s".
export function formatTimeLeft(deadline) {
  const now = Math.floor(Date.now() / 1000);
  let diff = Number(deadline) - now;
  if (diff <= 0) return "Scaduta";

  const days = Math.floor(diff / 86400);
  diff %= 86400;
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;

  const parts = [];
  if (days > 0) parts.push(days + "g");
  if (hours > 0 || days > 0) parts.push(hours + "h");
  parts.push(minutes + "m");
  parts.push(seconds + "s");
  return parts.join(" ");
}