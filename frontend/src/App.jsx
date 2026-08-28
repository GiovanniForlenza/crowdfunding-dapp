import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [contribAmount, setContribAmount] = useState({});

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask non e' installato!");
      return;
    }
    try {
      // 1. Controlla se siamo GIA' connessi (non apre popup)
      let accounts = await window.ethereum.request({ method: "eth_accounts" });

      // 2. Solo se non lo siamo, chiedi il permesso (apre popup)
      if (accounts.length === 0) {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      }

      setAccount(accounts[0]);
    } catch (error) {
      console.error("Errore connessione:", error);
    }
  }

  async function loadCampaigns(){
    if(typeof window.ethereum === "undefined") return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const count = await contract.campaignCount();

    const list = [];
    for(let i = 0; i < count; i++){
      const c = await contract.campaigns(i);
      list.push({
        id: i,
        creator: c[0],
        goal: c[1],
        deadline: c[2],
        raised: c[3],
        claimed: c[4]
      });
    }
    setCampaigns(list);
  }

  async function getContractWithSigner(){
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  async function createCampaign(){
    if(!goal || !duration) {
      alert("Inserisci obiettivo e durata!");
      return;
    }
    try {
      const contract = await getContractWithSigner();
      const goalInWei = ethers.parseEther(goal);
      const durationInSeconds = parseInt(duration);
      
      // metamask chiede la firma
      const tx = await contract.createCampaign(goalInWei, durationInSeconds)
      await tx.wait();

      alert("Campagna creata");
      setGoal("");
      setDuration("");
      loadCampaigns();
    } catch (error){
      console.error("Errore creazione campagna:", error);
      alert("Errore: " + (error.reason || error.message));
    }
  }

  async function contribute(id, amountEth){
    try{
      const contract = await getContractWithSigner();
      const tx = await contract.contribute(id, {
        value: ethers.parseEther(amountEth),
      });
      await tx.wait();
      alert("Contributo inviato");
      loadCampaigns();
    } catch (error) {
      console.error(error);
      alert("Errore: " + (error.reason || error.message));
    }
  }

  async function withdraw(id){
    try{
      const contract = await getContractWithSigner();
      const tx = await contract.withdraw(id);
      await tx.wait();
      alert("Fondi prelevati");
      loadCampaigns();
    } catch (error) {
      console.error(error);
      alert("Errore: " + (error.reason || error.message));
    }
  }

  async function refund(id) {
    try{
      
      const contract = await getContractWithSigner();
      const tx = await contract.refund(id);
      await tx.wait();
      alert("Rimborso ricevuto");
      loadCampaigns();

    } catch (error) {
      console.error(error);
      alert("Errore: " + (error.reason || error.message));
    }

  }

  async function switchAccount() {
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Cambio account annullato:", error);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [account]);

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;

    function handleAccountsChanged(accounts) {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
      }
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    // pulizia quando il componente si smonta
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Crowdfunding DApp</h1>
      {account ? (
        <p>Connesso come: <strong>{account}</strong></p>
      ) : (
        <button onClick={connectWallet}>Connetti MetaMask</button>
      )}
      <button onClick={switchAccount} style={{ marginLeft: "0.5rem" }}>
        Cambia account
      </button>

      <h2>Campagne ({campaigns.length})</h2>
      {campaigns.map((c) => {
        const isCreator = account && c.creator.toLowerCase() === account.toLowerCase();
        const now = Math.floor(Date.now() / 1000);
        const expired = now >= Number(c.deadline);
        const goalReached = c.raised >= c.goal;
        const stato = !expired ? "In corso" : goalReached ? "Riuscita" : "Fallita";

        return (
          <div key={c.id} style={{ border: "1px solid #ccc", padding: "1rem", margin: "0.5rem 0" }}>
            <p><strong>Campagna #{c.id}</strong></p>
            <p>Obiettivo: {ethers.formatEther(c.goal)} ETH</p>
            <p>Raccolto: {ethers.formatEther(c.raised)} ETH</p>
            <p>Stato: {stato}</p>

            {/* Contribuire */}
            <input
              type="text"
              placeholder="ETH da contribuire"
              value={contribAmount[c.id] || ""}
              onChange={(e) =>
                setContribAmount({ ...contribAmount, [c.id]: e.target.value })
              }
            />
            <button
              onClick={() => contribute(c.id, contribAmount[c.id])}
              style={{ marginLeft: "0.5rem" }}
            >
              Contribuisci
            </button>

            {/* Prelevare: solo il creatore */}
            {isCreator && (
              <button onClick={() => withdraw(c.id)} style={{ marginLeft: "0.5rem" }}>
                Preleva (creatore)
              </button>
            )}

            {/* Rimborso */}
            <button onClick={() => refund(c.id)} style={{ marginLeft: "0.5rem" }}>
              Rimborso
            </button>
          </div>
        );
      })}

      {account && (
        <div style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #888" }}>
          <h2>Crea una campagna</h2>
          <input
            type="text"
            placeholder="Obiettivo in ETH (es. 10)"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <input
            type="text"
            placeholder="Durata in secondi (es. 3600)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          />
          <button onClick={createCampaign} style={{ marginLeft: "0.5rem" }}>
            Crea
          </button>
        </div>
      )}

    </div>
  );
}

export default App;