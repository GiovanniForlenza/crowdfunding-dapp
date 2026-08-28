import { useState } from "react";
import Countdown from "./Countdown";
import {
  toEth,
  shortAddress,
  campaignStatus,
  statusLabel,
  progressPercent,
} from "../utils";

// Card di una singola campagna con azioni contestuali.
export default function CampaignCard({ campaign, account, onContribute, onWithdraw, onRefund, busy }) {
  const [amount, setAmount] = useState("");

  const status = campaignStatus(campaign);
  const percent = progressPercent(campaign);

  const isCreator = account && campaign.creator.toLowerCase() === account.toLowerCase();
  const hasContributed = campaign.myContribution > 0n;

  // condizioni per mostrare le azioni
  const canContribute = status === "active";
  const canWithdraw = isCreator && status === "succeeded" && !campaign.claimed;
  const canRefund = status === "failed" && hasContributed;

  async function handleContribute() {
    if (!amount) return;
    await onContribute(campaign.id, amount);
    setAmount("");
  }

  return (
    <article className={"card card--" + status}>
      <header className="card__head">
        <h3 className="card__title">{campaign.title}</h3>
        <span className={"pill pill--" + status}>{statusLabel(status)}</span>
      </header>

      {campaign.description && <p className="card__desc">{campaign.description}</p>}

      <div className="card__progress">
        <div className="bar">
          <div className="bar__fill" style={{ width: percent + "%" }} />
        </div>
        <div className="card__amounts">
          <span className="mono">{toEth(campaign.raised)} ETH</span>
          <span className="muted"> / {toEth(campaign.goal)} ETH</span>
          <span className="card__pct">{percent}%</span>
        </div>
      </div>

      <dl className="card__meta">
        <div>
          <dt>Creatore</dt>
          <dd className="mono">{shortAddress(campaign.creator)}{isCreator ? " (tu)" : ""}</dd>
        </div>
        <div>
          <dt>Tempo</dt>
          <dd>{status === "active" ? <Countdown deadline={campaign.deadline} /> : "Conclusa"}</dd>
        </div>
        {hasContributed && (
          <div>
            <dt>Il tuo contributo</dt>
            <dd className="mono">{toEth(campaign.myContribution)} ETH</dd>
          </div>
        )}
      </dl>

      <div className="card__actions">
        {canContribute && (
          <div className="contribute">
            <input
              type="text"
              inputMode="decimal"
              placeholder="ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
            />
            <button className="btn btn--primary" onClick={handleContribute} disabled={busy}>
              Contribuisci
            </button>
          </div>
        )}

        {canWithdraw && (
          <button className="btn btn--success" onClick={() => onWithdraw(campaign.id)} disabled={busy}>
            Preleva fondi
          </button>
        )}

        {canRefund && (
          <button className="btn btn--warn" onClick={() => onRefund(campaign.id)} disabled={busy}>
            Richiedi rimborso
          </button>
        )}

        {/* messaggi di stato quando non ci sono azioni */}
        {status === "failed" && isCreator && !hasContributed && (
          <span className="hint">Obiettivo non raggiunto</span>
        )}
        {status === "succeeded" && campaign.claimed && (
          <span className="hint">Fondi gia' prelevati dal creatore</span>
        )}
        {status === "failed" && hasContributed === false && !isCreator && (
          <span className="hint">Campagna fallita</span>
        )}
      </div>
    </article>
  );
}