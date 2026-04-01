export default function AdminAlert({ message }) {
  return (
    <div className="border border-red-500/30 bg-[rgba(255,0,0,0.05)] p-4 rounded-xl relative overflow-hidden">
      {/* Subtle pulse glow */}
      <div className="absolute inset-0 animate-pulse opacity-20 bg-red-500 blur-xl" />

      <div className="relative z-10 flex flex-col gap-2">
        <span className="text-red-400 text-xs tracking-[0.2em] uppercase">
          Admin Alert
        </span>

        <p className="text-sm text-white tracking-wide">
          {message}
        </p>

        <span className="text-[10px] text-red-300/70 tracking-widest uppercase">
          Action Required
        </span>
      </div>
    </div>
  );
}