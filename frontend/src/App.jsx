import { useState, useEffect, useCallback } from "react";
import "./App.css";
import * as chain from "./blockchain";
import { campaignStatus, shortAddress } from "./utils";
import CampaignCard from "./components/CampaignCard";
import CreateCampaignForm from "./components/CreateCampaignForm";

export default function App() {
  const [account, setAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [tab, setTab] = useState("active"); // active | concluded | mine
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (acc) => {
    try {
      setLoading(true);
      const list = await chain.loadCampaigns(acc);
      setCampaigns(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const acc = await chain.getCurrentAccount();
      setAccount(acc);
      refresh(acc);
    })();
  }, [refresh]);

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;
    function onAccountsChanged(accounts) {
      const acc = accounts.length > 0 ? accounts[0] : null;
      setAccount(acc);
      refresh(acc);
    }
    window.ethereum.on("accountsChanged", onAccountsChanged);
    return () => window.ethereum.removeListener("accountsChanged", onAccountsChanged);
  }, [refresh]);

  async function handleConnect() {
    try {
      const acc = await chain.connectWallet();
      setAccount(acc);
      refresh(acc);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSwitch() {
    try {
      const acc = await chain.switchAccount();
      setAccount(acc);
      refresh(acc);
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    setAccount(null);
    setTab("active");
  }

  async function runTx(fn) {
    try {
      setBusy(true);
      await fn();
      await refresh(account);
    } catch (err) {
      console.error(err);
      alert("Errore: " + (err.reason || err.shortMessage || err.message));
    } finally {
      setBusy(false);
    }
  }

  const handleCreate = (data) =>
    runTx(() => chain.createCampaign(data.goalEth, data.durationSeconds, data.title, data.description));
  const handleContribute = (id, amount) => runTx(() => chain.contribute(id, amount));
  const handleWithdraw = (id) => runTx(() => chain.withdraw(id));
  const handleRefund = (id) => runTx(() => chain.refund(id));

  const active = campaigns.filter((c) => campaignStatus(c) === "active");
  const concluded = campaigns.filter((c) => campaignStatus(c) !== "active");
  const mine = campaigns.filter(
    (c) =>
      account &&
      (c.creator.toLowerCase() === account.toLowerCase() || c.myContribution > 0n)
  );

  const shown = tab === "active" ? active : tab === "concluded" ? concluded : mine;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">&#9670;</span>
          <span className="brand__name">FundChain</span>
        </div>

        <div className="wallet">
          {account ? (
            <>
              <span className="wallet__addr mono">{shortAddress(account)}</span>
              <button className="btn btn--ghost btn--sm" onClick={handleSwitch}>Cambia</button>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={handleConnect}>Connetti wallet</button>
          )}
        </div>
      </header>

      <main className="main">
        {!account ? (
          <div className="empty">
            <h1 className="hero">Raccolte fondi senza intermediari.</h1>
            <p className="hero__sub">
              Crea una campagna, contribuisci, e lascia che sia il contratto a garantire
              le regole. Collega il wallet per iniziare.
            </p>
            <button className="btn btn--primary btn--big" onClick={handleConnect}>
              Connetti wallet
            </button>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <CreateCampaignForm onCreate={handleCreate} busy={busy} />
            </div>

            <nav className="tabs">
              <button
                className={"tab" + (tab === "active" ? " tab--on" : "")}
                onClick={() => setTab("active")}
              >
                Attive <span className="tab__count">{active.length}</span>
              </button>
              <button
                className={"tab" + (tab === "concluded" ? " tab--on" : "")}
                onClick={() => setTab("concluded")}
              >
                Concluse <span className="tab__count">{concluded.length}</span>
              </button>
              <button
                className={"tab" + (tab === "mine" ? " tab--on" : "")}
                onClick={() => setTab("mine")}
              >
                Le mie <span className="tab__count">{mine.length}</span>
              </button>
            </nav>

            {loading ? (
              <p className="state">Caricamento campagne...</p>
            ) : shown.length === 0 ? (
              <p className="state">
                {tab === "mine"
                  ? "Non hai ancora creato campagne ne' contribuito."
                  : tab === "active"
                  ? "Nessuna campagna attiva. Creane una!"
                  : "Nessuna campagna conclusa."}
              </p>
            ) : (
              <section className="grid">
                {shown.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    account={account}
                    onContribute={handleContribute}
                    onWithdraw={handleWithdraw}
                    onRefund={handleRefund}
                    busy={busy}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>Progetto Sicurezza dei Dati</span>
        <span className="muted">Ethereum &middot; Solidity &middot; React</span>
      </footer>
    </div>
  );
}