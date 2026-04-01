
export default function AccessLog({ log }) {
  const statusStyles = {
    granted: "text-green-400 border-green-500/30",
    denied: "text-red-400 border-red-500/30",
    alert: "text-yellow-400 border-yellow-500/30",
  };

  return (
    <div
      className={`flex items-center justify-between border px-4 py-3 rounded-lg text-sm tracking-wide ${statusStyles[log.status]}`}
    >
      <div className="flex flex-col">
        <span className="uppercase tracking-wider">{log.user}</span>
        <span className="text-xs opacity-60">{log.time}</span>
      </div>

      <div className="text-xs uppercase opacity-70">
        {log.method}
      </div>

      <div className="text-xs uppercase font-semibold">
        {log.status}
      </div>
    </div>
  );
}
