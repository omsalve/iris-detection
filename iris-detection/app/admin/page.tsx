"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const API = "http://localhost:8000";

type LogEntry = {
  id: string;
  method: "iris" | "otp" | "admin_alert" | "admin_override";
  status: "granted" | "denied" | "triggered";
  timestamp: string;
  location?: string;
  details?: string;
};

type EnrolledUser = {
  id: string;
  name: string;
  enrolled_at: string;
};

const METHOD_COLORS = {
  iris: { bg: "rgba(0, 200, 140, 0.1)", border: "rgba(0, 200, 140, 0.3)", text: "rgba(0, 200, 140, 0.9)" },
  otp: { bg: "rgba(100, 150, 255, 0.1)", border: "rgba(100, 150, 255, 0.3)", text: "rgba(100, 150, 255, 0.9)" },
  admin_alert: { bg: "rgba(255, 100, 100, 0.1)", border: "rgba(255, 100, 100, 0.3)", text: "rgba(255, 100, 100, 0.9)" },
  admin_override: { bg: "rgba(255, 150, 0, 0.1)", border: "rgba(255, 150, 0, 0.3)", text: "rgba(255, 150, 0, 0.9)" },
};

const STATUS_COLORS = {
  granted: { bg: "rgba(0, 200, 140, 0.15)", text: "rgba(0, 200, 140, 0.9)" },
  denied: { bg: "rgba(255, 100, 100, 0.15)", text: "rgba(255, 100, 100, 0.9)" },
  triggered: { bg: "rgba(255, 150, 0, 0.15)", text: "rgba(255, 150, 0, 0.9)" },
};

const METHOD_LABEL = {
  iris: "Iris Scan",
  otp: "OTP",
  admin_alert: "Admin Alert",
  admin_override: "Admin Override",
};

function parseTimestamp(timestamp: any): Date {
  // Handle Firestore timestamp object format
  if (timestamp && typeof timestamp === "object" && "_seconds" in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  // Handle ISO string format - ensure it's treated as UTC
  if (typeof timestamp === "string") {
    // If it's ISO format without Z, add Z to indicate UTC
    let isoString = timestamp;
    if (isoString && !isoString.endsWith("Z")) {
      isoString = isoString + "Z";
    }
    return new Date(isoString);
  }
  // Handle number (milliseconds)
  if (typeof timestamp === "number") {
    return new Date(timestamp);
  }
  return new Date();
}

function timeAgo(timestamp: any): string {
  const date = parseTimestamp(timestamp);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function fmt(timestamp: any): string {
  const date = parseTimestamp(timestamp);
  // toLocaleString will automatically convert UTC to browser's local timezone
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState("");
  const [activeTab, setActiveTab] = useState<"logs" | "users">("logs");

  // Clock
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch data on mount and every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [logsRes, usersRes] = await Promise.all([
          fetch(`${API}/admin/logs`).then((r) => r.json()),
          fetch(`${API}/admin/enrolled-users`).then((r) => r.json()),
        ]);

        if (logsRes.logs) {
          setLogs(logsRes.logs);
        }
        if (usersRes.users) {
          setEnrolledUsers(usersRes.users);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data from Firebase");
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(135deg, #0a0e27 0%, #16213e 40%, #0f3460 100%)",
        fontFamily: "monospace",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-8 py-6 border-b flex justify-between items-center"
        style={{ borderColor: "rgba(0,200,140,0.1)", background: "rgba(10, 14, 39, 0.95)" }}
      >
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="text-xs tracking-[0.3em] uppercase opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
              ← Back
            </span>
          </Link>
          <h1 className="text-lg tracking-[0.15em] uppercase" style={{ color: "rgba(0,200,140, 0.9)" }}>
            ◆ Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-xs tracking-widest" style={{ color: "rgba(0,200,140, 0.6)" }}>
            {now}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="px-8 py-4 flex gap-8 border-b flex-wrap"
        style={{ borderColor: "rgba(0,200,140,0.1)" }}
      >
        <div>
          <span className="text-xs tracking-widest opacity-60">Live Logs</span>
          <div className="text-2xl font-bold" style={{ color: "rgba(0,200,140, 0.9)" }}>
            {logs.length}
          </div>
        </div>
        <div>
          <span className="text-xs tracking-widest opacity-60">Enrolled Users</span>
          <div className="text-2xl font-bold" style={{ color: "rgba(0,200,140, 0.9)" }}>
            {enrolledUsers.length}
          </div>
        </div>
        <div>
          <span className="text-xs tracking-widest opacity-60">Status</span>
          <div className="text-2xl font-bold" style={{ color: error ? "rgba(255,100,100,0.9)" : "rgba(0,200,140, 0.9)" }}>
            {error ? "ERROR" : loading ? "…" : "LIVE"}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="px-8 py-4 flex gap-6 border-b"
        style={{ borderColor: "rgba(0,200,140,0.1)" }}
      >
        <button
          onClick={() => setActiveTab("logs")}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{
            color: activeTab === "logs" ? "rgba(0,200,140, 0.9)" : "rgba(255,255,255,0.3)",
            borderBottom: activeTab === "logs" ? "2px solid rgba(0,200,140, 0.9)" : "none",
            paddingBottom: "8px",
          }}
        >
          Access Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{
            color: activeTab === "users" ? "rgba(0,200,140, 0.9)" : "rgba(255,255,255,0.3)",
            borderBottom: activeTab === "users" ? "2px solid rgba(0,200,140, 0.9)" : "none",
            paddingBottom: "8px",
          }}
        >
          Enrolled Users ({enrolledUsers.length})
        </button>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              background: "rgba(255,100,100, 0.1)",
              border: "1px solid rgba(255,100,100,0.3)",
              color: "rgba(255,100,100,0.9)",
            }}
          >
            <span className="text-xs tracking-widest uppercase">⚠ {error}</span>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div>
            {loading && logs.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                <span className="text-xs tracking-widest uppercase">Loading logs…</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                <span className="text-xs tracking-widest uppercase">No logs found</span>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const methodColor = METHOD_COLORS[log.method] || METHOD_COLORS.iris;
                  const statusColor = STATUS_COLORS[log.status] || STATUS_COLORS.granted;

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg border transition-all hover:border-opacity-100"
                      style={{
                        background: methodColor.bg,
                        border: `1px solid ${methodColor.border}`,
                      }}
                    >
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Method Badge */}
                          <div
                            className="px-3 py-1 rounded text-xs tracking-widest uppercase whitespace-nowrap"
                            style={{
                              background: methodColor.bg,
                              color: methodColor.text,
                              border: `1px solid ${methodColor.border}`,
                            }}
                          >
                            {METHOD_LABEL[log.method] || log.method}
                          </div>

                          {/* Status Badge */}
                          <div
                            className="px-3 py-1 rounded text-xs tracking-widest uppercase whitespace-nowrap"
                            style={{
                              background: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.text}`,
                            }}
                          >
                            {log.status === "granted" ? "✓" : log.status === "denied" ? "✕" : "!"}
                            {" "}
                            {log.status}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs opacity-60">
                          <span className="tracking-widest">{timeAgo(log.timestamp)}</span>
                          <span className="text-right min-w-[120px] tracking-widest">
                            {fmt(log.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      {(log.location || log.details) && (
                        <div className="mt-3 text-xs opacity-60 tracking-widest">
                          {log.location && <div>Location: {log.location}</div>}
                          {log.details && <div>Details: {log.details}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {loading && enrolledUsers.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                <span className="text-xs tracking-widest uppercase">Loading users…</span>
              </div>
            ) : enrolledUsers.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                <span className="text-xs tracking-widest uppercase">No enrolled users</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border transition-all hover:border-opacity-100"
                    style={{
                      background: "rgba(0,200,140, 0.05)",
                      border: "1px solid rgba(0,200,140,0.2)",
                    }}
                  >
                    <div className="mb-3">
                      <h3
                        className="text-sm font-semibold tracking-wide break-words"
                        style={{ color: "rgba(0,200,140, 0.9)" }}
                      >
                        {user.name || "Unknown"}
                      </h3>
                      <p className="text-xs opacity-60 tracking-widest mt-1 break-all">{user.id}</p>
                    </div>

                    <div className="text-xs opacity-50 tracking-widest">
                      Enrolled: {fmt(user.enrolled_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-8 py-4 mt-8 border-t flex justify-between items-center text-xs opacity-40 tracking-widest"
        style={{ borderColor: "rgba(0,200,140,0.1)" }}
      >
        <span>Auto-refreshing every 5 seconds</span>
        <span>Firebase Realtime Data</span>
      </div>
    </div>
  );
}
