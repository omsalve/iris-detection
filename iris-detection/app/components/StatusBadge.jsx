export default function StatusBadge({ status }) {
  const styles = {
    Secure: "text-green-400 border-green-500/40 shadow-[0_0_12px_rgba(0,255,150,0.2)]",
    Breach: "text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(255,80,80,0.25)]",
    Warning: "text-yellow-400 border-yellow-500/40 shadow-[0_0_12px_rgba(255,200,80,0.2)]",
  };

  return (
    <div
      className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border rounded-full ${styles[status]}`}
    >
      {status}
    </div>
  );
}
