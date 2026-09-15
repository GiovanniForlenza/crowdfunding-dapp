import { toEth, shortAddress } from "../utils";

// Descrive un evento in linguaggio umano.
function describe(e) {
  switch (e.type) {
    case "created":
      return `ha creato la campagna "${e.title}"`;
    case "contributed":
      return `ha contribuito con ${toEth(e.amount)} ETH alla campagna #${e.id}`;
    case "withdrawn":
      return `ha prelevato ${toEth(e.amount)} ETH dalla campagna #${e.id}`;
    case "refunded":
      return `ha ricevuto un rimborso di ${toEth(e.amount)} ETH dalla campagna #${e.id}`;
    default:
      return "";
  }
}

const icon = {
  created: "◆",
  contributed: "↑",
  withdrawn: "✓",
  refunded: "↩",
};

export default function Activity({ events }) {
  if (events.length === 0) {
    return <p className="state">Nessuna attivita' registrata.</p>;
  }

  return (
    <ul className="activity">
      {events.map((e, i) => (
        <li key={i} className={"activity__item activity__item--" + e.type}>
          <span className="activity__icon">{icon[e.type]}</span>
          <span className="activity__text">
            <span className="mono">{shortAddress(e.actor)}</span> {describe(e)}
          </span>
          <span className="activity__block">blocco #{e.block}</span>
        </li>
      ))}
    </ul>
  );
}