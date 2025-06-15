import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
// @ts-ignore-next-line
import { QrReader } from "react-qr-reader";
import { getAttendanceForStudent, insertAttendance } from "@/integrations/supabase/attendance";

type AttendanceRecord = {
  subject: string,
  date: string,
  time?: string,
  marked: boolean,
  id?: string;
};

const EXAMPLE_ATTENDANCE = [
  { subject: "Compiler Design", date: "2025-06-01", marked: false },
  { subject: "Computer Network", date: "2025-06-01", marked: false },
  { subject: "Development Engineering", date: "2025-06-01", marked: false },
  { subject: "Machine Learning", date: "2025-06-01", marked: false },
  { subject: "GIS", date: "2025-06-01", marked: false },
];

// Academic Year normalization mapping
const YEAR_NORMALIZATION: Record<string, string> = {
  "1": "First Year", "first year": "First Year", "First Year": "First Year",
  "2": "Second Year", "second year": "Second Year", "Second Year": "Second Year",
  "3": "Third Year", "third year": "Third Year", "Third Year": "Third Year",
  "4": "Fourth Year", "fourth year": "Fourth Year", "Fourth Year": "Fourth Year",
};

export default function StudentDashboard() {
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [att, setAtt] = useState<AttendanceRecord[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false); // To prevent multiple scans/session
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
      if (data && !hasScanned) {
        setHasScanned(true);
        setScanResult(data?.text ?? data);
        // Wait for confirmation before marking attendance
      }
    } catch (err) {
      setShowToast("Scan error. Try again.");
      setHasScanned(false);
      setScanMode(false);
    }
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("qr_user") ?? "null"); }
    catch { return null; }
  })();

  useEffect(() => {
    if (!user) return;
    setLoadingAtt(true);
    getAttendanceForStudent(user.roll || user.prn) // Use whatever is available
      .then(data =>
        setAtt(
          (data || []).map((rec: any) => ({
            subject: rec.subject,
            date: rec.date,
            time: rec.time,
            marked: true,
            id: rec.id,
          }))
        )
      )
      .catch(() => setAtt([]))
      .finally(() => setLoadingAtt(false));
  }, [user]);

  async function handleMarkAttendance() {
    // Insert attendance record in Supabase and update UI
    if (!user) {
      setShowToast("User not found. Please log in again.");
      return;
    }
    setShowToast("Marking attendance...");
    try {
      const now = new Date();
      let subject = "Unknown";
      let date = now.toISOString().slice(0, 10);
      // By default, make time "HH:mm" (colon format)
      let time = now.toTimeString().slice(0, 5); // "09:30"
      if (scanResult && scanResult.includes("@")) {
        const parts = scanResult.split("@");
        if (parts.length >= 3) {
          subject = parts[0];
          date = parts[1];
          time = parts[2];
          // Normalize time: ensure colon present, always "HH:mm"
          if (typeof time === "string" && time.length === 4 && !time.includes(":")) {
            // e.g., "0930" -> "09:30"
            time = `${time.slice(0,2)}:${time.slice(2,4)}`;
          }
        }
      } else {
        // In case time is "0930", convert to "09:30"
        if (typeof time === "string" && time.length === 4 && !time.includes(":")) {
          time = `${time.slice(0,2)}:${time.slice(2,4)}`;
        }
      }
      // Normalize year for matching
      let rawYear = user.year || "Unknown";
      let normalizedYear = YEAR_NORMALIZATION[String(rawYear).trim().toLowerCase()] || rawYear;

      await insertAttendance({
        student_id: user.roll || user.prn,
        student_name: user.name,
        subject,
        year: normalizedYear,
        date,
        time, // always "HH:mm" like "09:30"
        qr_code_value: scanResult || "",
        marked_by: "student"
      });
      setShowToast("Attendance marked!");
      setLoadingAtt(true);
      getAttendanceForStudent(user.roll || user.prn)
        .then(data =>
          setAtt(
            (data || []).map((rec: any) => ({
              subject: rec.subject,
              date: rec.date,
              time: rec.time,
              marked: true,
              id: rec.id,
            }))
          )
        )
        .finally(() => setLoadingAtt(false));
      setScanMode(false);
      setScanResult(null);
      setHasScanned(false);
    } catch (err: any) {
      setShowToast("Failed to mark: " + (err?.message || "Error"));
      setScanMode(false);
      setScanResult(null);
      setHasScanned(false);
    }
  }

  function handleScanCancel() {
    setScanResult(null);
    setHasScanned(false);
    setScanMode(false);
  }

  function totalPct() {
    // Calculate based on att.length
    const total = att.length;
    // Marked: all supabase entries (since one per mark)
    const marked = total;
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
            onClick={() => { setScanMode(true); setScanResult(null); setHasScanned(false); }}>
            <QrCode className="mr-2 w-7 h-7" /> Scan QR to Mark Attendance
          </button>
          {scanMode && (
            <div className="w-full flex flex-col items-center mb-3">
              <div className="relative bg-gray-50 p-3 rounded-lg shadow-inner ring-1 ring-indigo-300 mb-2"
                style={{ width: 250, minHeight: 200 }}>
                {!scanResult && (
                  <QrReader
                    constraints={{ facingMode: "environment" }}
                    onResult={result => { if (result) handleScan(result); }}
                  />
                )}
                {scanResult && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[160px]">
                    <span className="text-indigo-700 text-lg font-semibold mb-3 break-words text-center">
                      QR Scanned!
                    </span>
                    <span className="text-xs text-gray-500 break-words mb-3 select-all">{scanResult}</span>
                    <button
                      className="w-full bg-emerald-600 text-white px-4 py-2 rounded font-semibold mb-2 hover:bg-emerald-700 transition"
                      onClick={handleMarkAttendance}
                    >
                      Mark Attendance
                    </button>
                    <button
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-300 transition"
                      onClick={handleScanCancel}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!scanResult && (
                <button
                  className="text-xs mt-1 text-gray-500 underline"
                  onClick={handleScanCancel}>
                  Cancel
                </button>
              )}
            </div>
          )}
          <div className="w-full flex justify-between items-center mt-2">
            <div className="font-semibold text-indigo-700">Attendance %</div>
            <div className="font-bold text-xl text-emerald-600">{totalPct()}%</div>
          </div>
          <div className="w-full mt-2 rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-100">
            <div className="text-gray-700 text-sm font-medium mb-1">
              Attendance Records {loadingAtt && <span className="ml-2 text-xs text-gray-400">Loading...</span>}
            </div>
            <ul className="divide-y divide-indigo-100">
              {att.length === 0 && !loadingAtt && (<li className="text-gray-400 p-3">No attendance records found.</li>)}
              {att.map((a, i) => (
                <li key={a.id || i} className="flex justify-between py-1.5 items-center">
                  <span className="font-medium">{a.subject}</span>
                  <span className="text-emerald-600 font-semibold">Present</span>
                  <span className="text-xs text-gray-400">{a.date} ({a.time})</span>
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
