import { useState, useEffect } from "react";
import { formatTimeLeft } from "../utils";

// Mostra il tempo rimanente e si aggiorna ogni secondo (live).
export default function Countdown({ deadline }) {
  const [label, setLabel] = useState(() => formatTimeLeft(deadline));

  useEffect(() => {
    // aggiorno subito e poi ogni secondo
    setLabel(formatTimeLeft(deadline));
    const interval = setInterval(() => {
      setLabel(formatTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const expired = label === "Scaduta";

  return (
    <span className={"countdown" + (expired ? " countdown--expired" : "")}>
      {expired ? "Scaduta" : "Scade tra " + label}
    </span>
  );
}