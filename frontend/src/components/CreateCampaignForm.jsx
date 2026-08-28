import { useState } from "react";

// Form di creazione di una campagna.
export default function CreateCampaignForm({ onCreate, busy }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    if (!title || !goal || !duration) {
      alert("Inserisci almeno titolo, obiettivo e durata");
      return;
    }
    await onCreate({
      title,
      description,
      goalEth: goal,
      durationSeconds: parseInt(duration),
    });
    setTitle("");
    setDescription("");
    setGoal("");
    setDuration("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="btn btn--primary btn--big" onClick={() => setOpen(true)}>
        + Nuova campagna
      </button>
    );
  }

  return (
    <div className="form">
      <h2 className="form__title">Nuova campagna</h2>

      <label className="field">
        <span>Titolo</span>
        <input
          type="text"
          placeholder="Es. Raccolta fondi per..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Descrizione</span>
        <textarea
          placeholder="Spiega l'obiettivo della campagna"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Obiettivo (ETH)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="10"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Durata (secondi)</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="3600"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
      </div>

      <div className="form__actions">
        <button className="btn btn--ghost" onClick={() => setOpen(false)} disabled={busy}>
          Annulla
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={busy}>
          {busy ? "Creazione..." : "Crea campagna"}
        </button>
      </div>
    </div>
  );
}