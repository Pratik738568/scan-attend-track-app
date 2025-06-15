
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, View } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
// @ts-ignore-next-line
import { QrReader } from "react-qr-reader";

type AttendanceRecord = {
  subject: string,
  date: string,
  marked: boolean,
};

const EXAMPLE_ATTENDANCE = [
  { subject: "Mathematics", date: "2025-06-01", marked: true },
  { subject: "Physics", date: "2025-06-01", marked: false },
  { subject: "Chemistry", date: "2025-05-28", marked: true },
  { subject: "English", date: "2025-05-27", marked: true },
];

export default function StudentDashboard() {
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [att, setAtt] = useState(EXAMPLE_ATTENDANCE);
  const [showToast, setShowToast] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  function handleLogout() {
    localStorage.removeItem("qr_user");
    navigate("/auth");
  }

  function handleScan(data: any) {
    try {
      if (data) {
        setScanResult(data?.text ?? data);
        setShowToast("Attendance marked!");
        // Just mark a subject randomly in demo
        setAtt(a =>
          a.map(rec => (rec.marked ? rec : { ...rec, marked: true }))
        );
        setScanMode(false);
      }
    } catch (err) {
      setShowToast("Scan error. Try again.");
      setScanMode(false);
    }
  }

  function totalPct() {
    const total = att.length, marked = att.filter(r => r.marked).length;
    return total ? Math.round((marked / total) * 100) : 0;
  }

  return (
    <RoleGuard role="student">
      <div className="min-h-screen flex flex-col items-center px-2 pt-4 bg-gradient-to-br from-indigo-100 to-indigo-50">
        <header className="mb-2 w-full flex items-center justify-between px-2">
          <span className="font-semibold text-indigo-700 text-xl flex items-center gap-2">
            <QrCode className="w-7 h-7" /> Student Dashboard
          </span>
          <button className="py-1 px-4 text-xs rounded bg-indigo-200 hover:bg-indigo-300 ml-2 font-medium" onClick={handleLogout}>Logout</button>
        </header>
        <div className="w-full max-w-lg bg-white rounded-xl shadow-xl px-6 py-7 flex flex-col gap-4 items-center">
          <button
            className="w-full flex justify-center items-center py-4 mb-2 rounded-xl bg-indigo-600 text-white text-lg font-bold shadow-md hover-scale transition"
            onClick={() => setScanMode(true)}>
            <QrCode className="mr-2 w-7 h-7" /> Scan QR to Mark Attendance
          </button>
          {scanMode && (
            <div className="w-full flex flex-col items-center mb-3">
              <div className="relative bg-gray-50 p-3 rounded-lg shadow-inner ring-1 ring-indigo-300 mb-2" style={{ width: 250, minHeight: 200 }}>
                <QrReader
                  constraints={{ facingMode: "environment" }}
                  onResult={result => { if (result) handleScan(result); }}
                />
              </div>
              <button
                className="text-xs mt-1 text-gray-500 underline"
                onClick={() => setScanMode(false)}>
                Cancel
              </button>
            </div>
          )}
          <div className="w-full flex justify-between items-center mt-2">
            <div className="font-semibold text-indigo-700">Attendance %</div>
            <div className="font-bold text-xl text-emerald-600">{totalPct()}%</div>
          </div>
          <div className="w-full mt-2 rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-100">
            <div className="text-gray-700 text-sm font-medium mb-1">Attendance Records</div>
            <ul className="divide-y divide-indigo-100">
              {att.map((a, i) => (
                <li key={i} className="flex justify-between py-1.5 items-center">
                  <span className="font-medium">{a.subject}</span>
                  <span className={a.marked ? "text-emerald-600 font-semibold" : "text-orange-400"}>
                    {a.marked ? "Present" : "Absent"}
                  </span>
                  <span className="text-xs text-gray-400">{a.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {showToast && (
          <div className="fixed left-1/2 bottom-10 transform -translate-x-1/2 bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg animate-fade-in">{showToast}</div>
        )}
      </div>
    </RoleGuard>
  );
}
