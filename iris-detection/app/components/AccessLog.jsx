export default function AccessLog({ log }) {
  const statusStyles = {
    granted:   "text-green-400 border-green-500/30",
    denied:    "text-red-400 border-red-500/30",
    triggered: "text-yellow-400 border-yellow-500/30",
    alert:     "text-yellow-400 border-yellow-500/30",
  };

  // Extract snapshot URL from details string if present
  const snapshotMatch = log.details?.match(/snapshot=(https?:\/\/\S+)/);
  const snapshotUrl   = log.snapshot_url || (snapshotMatch ? snapshotMatch[1] : null);

  const style = statusStyles[log.status] ?? "text-gray-400 border-gray-500/30";

  return (
    <div
      className={`flex items-center gap-3 border px-4 py-3 rounded-lg text-sm tracking-wide ${style}`}
    >
      {/* Eye snapshot thumbnail */}
      {snapshotUrl && snapshotUrl.startsWith("http") && (
        <div
          className="flex-shrink-0 overflow-hidden border rounded"
          style={{
            width: "48px",
            height: "32px",
            borderColor: "rgba(0,200,140,0.2)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={snapshotUrl}
            alt="Eye scan"
            className="w-full h-full object-cover"
            style={{ filter: "hue-rotate(100deg) saturate(0.5) brightness(0.85)" }}
          />
        </div>
      )}

      {/* No snapshot placeholder */}
      {(!snapshotUrl || !snapshotUrl.startsWith("http")) && log.method === "iris" && (
        <div
          className="flex-shrink-0 flex items-center justify-center rounded border"
          style={{
            width: "48px",
            height: "32px",
            borderColor: "rgba(0,200,140,0.1)",
            background: "rgba(0,200,140,0.04)",
          }}
        >
          <span style={{ fontSize: "16px" }}>👁</span>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <span className="uppercase tracking-wider truncate">{log.user ?? log.method}</span>
        <span className="text-xs opacity-60">{log.time ?? log.timestamp}</span>
      </div>

      <div className="text-xs uppercase opacity-70 flex-shrink-0">
        {log.method}
      </div>

      <div className="text-xs uppercase font-semibold flex-shrink-0">
        {log.status}
      </div>
    </div>
  );
}