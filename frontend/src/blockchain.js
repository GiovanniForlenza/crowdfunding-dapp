import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

// Provider = connessione in sola LETTURA (nessuna firma, nessun costo).
function getProvider() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask non e' installato");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

// Contratto in sola lettura.
function getReadContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Contratto collegato al SIGNER = puo' SCRIVERE (richiede firma su MetaMask).
async function getWriteContract() {
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// --- Wallet ---

// Ritorna l'account gia' connesso senza aprire popup (o null).
export async function getCurrentAccount() {
  if (typeof window.ethereum === "undefined") return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts.length > 0 ? accounts[0] : null;
}

// Chiede la connessione (apre il popup solo se serve).
export async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask non e' installato");
  }
  let accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (accounts.length === 0) {
    accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return accounts[0];
}

// Forza la schermata di scelta account di MetaMask.
export async function switchAccount() {
  await window.ethereum.request({
    method: "wallet_requestPermissions",
    params: [{ eth_accounts: {} }],
  });
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0];
}

// --- Lettura campagne ---

// Carica tutte le campagne, arricchite con il contributo dell'utente corrente.
export async function loadCampaigns(account) {
  const contract = getReadContract();
  const count = await contract.campaignCount();

  const list = [];
  for (let i = 0; i < count; i++) {
    const c = await contract.campaigns(i);

    // contributo dell'account corrente a questa campagna (per "le mie campagne")
    let myContribution = 0n;
    if (account) {
      myContribution = await contract.contributions(i, account);
    }

    list.push({
      id: i,
      creator: c[0],
      title: c[1],
      description: c[2],
      goal: c[3],
      deadline: c[4],
      raised: c[5],
      claimed: c[6],
      myContribution,
    });
  }
  return list;
}

// --- Scrittura (transazioni firmate) ---

export async function createCampaign(goalEth, durationSeconds, title, description) {
  const contract = await getWriteContract();
  const tx = await contract.createCampaign(
    ethers.parseEther(goalEth),
    durationSeconds,
    title,
    description
  );
  await tx.wait();
}

export async function contribute(id, amountEth) {
  const contract = await getWriteContract();
  const tx = await contract.contribute(id, { value: ethers.parseEther(amountEth) });
  await tx.wait();
}

export async function withdraw(id) {
  const contract = await getWriteContract();
  const tx = await contract.withdraw(id);
  await tx.wait();
}

export async function refund(id) {
  const contract = await getWriteContract();
  const tx = await contract.refund(id);
  await tx.wait();
}