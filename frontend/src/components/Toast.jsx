export default function Toast({ toasts }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={"toast toast--" + t.type}>
          {t.message}
        </div>
      ))}
    </div>
  );
}