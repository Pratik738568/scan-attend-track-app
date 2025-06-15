
import { useNavigate } from "react-router-dom";
import { QrCode, View, List } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Only keep year options for 2nd, 3rd, 4th year (remove 'First Year')
const YEAR_OPTIONS = [
  "Second Year",
  "Third Year",
  "Fourth Year"
] as const;

// Only show faculty for 'Third Year'
const FACULTY_DATA_BY_YEAR: Record<string, { name: string; sessions: number }[]> = {
  "Second Year": [], // blank
  "Third Year": [
    { name: "Gajanan Tikhe", sessions: 0 },
    { name: "Amol Jumde", sessions: 0 },
    { name: "Sunny Gandhi", sessions: 0 },
    { name: "Urvashi Pote", sessions: 0 }
  ],
  "Fourth Year": [] // blank
};

// Update Department Attendance to have 5 subjects for Third Year
const DEPT_ATTENDANCE_BY_YEAR: Record<
  string,
  { subject: string; present: number; total: number }[]
> = {
  "Second Year": [],
  "Third Year": [
    { subject: "Data Structures", present: 43, total: 50 },
    { subject: "Operating Systems", present: 41, total: 50 },
    { subject: "Computer Networks", present: 48, total: 50 },
    { subject: "Database Management", present: 45, total: 50 },
    { subject: "Discrete Mathematics", present: 40, total: 50 },
  ],
  "Fourth Year": []
};

export default function HODDashboard() {
  const [selectedYear, setSelectedYear] = useState<(typeof YEAR_OPTIONS)[number]>("Third Year");
  const [qrOpen, setQROpen] = useState(false);
  const [qrData, setQRData] = useState({ subject: "", date: "", time: "" });
  const [showToast, setShowToast] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("qr_user");
    navigate("/auth");
  }

  function handleCreateQR(e: React.FormEvent) {
    e.preventDefault();
    if (!qrData.subject || !qrData.date || !qrData.time) {
      setShowToast("All fields required.");
      return;
    }
    setQROpen(true);
    setShowToast("QR Code generated!");
  }

  const facultyList = FACULTY_DATA_BY_YEAR[selectedYear] || [];
  const deptAttendance = DEPT_ATTENDANCE_BY_YEAR[selectedYear] || [];

  return (
    <RoleGuard role="hod">
      <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-fuchsia-100 flex flex-col items-center px-2 pt-4">
        <header className="mb-2 w-full flex items-center justify-between px-2">
          <span className="font-semibold text-indigo-700 text-xl flex items-center gap-2">
            <QrCode className="w-7 h-7" />
            HOD Dashboard
            <span className="ml-2 px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-600 text-xs font-bold ring-1 ring-fuchsia-300">HOD MODE</span>
          </span>
          <button className="py-1 px-4 text-xs rounded bg-indigo-200 hover:bg-indigo-300 ml-2 font-medium" onClick={handleLogout}>Logout</button>
        </header>
        {/* Year selection */}
        <div className="w-full max-w-lg flex justify-end mb-3">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-indigo-700">Select Year: </label>
            <select
              id="year-select"
              className="border border-fuchsia-200 bg-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value as (typeof YEAR_OPTIONS)[number])}
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full max-w-lg bg-white rounded-xl shadow-xl px-6 py-6 flex flex-col gap-1 items-center">
          <form className="w-full bg-fuchsia-50 rounded-lg py-4 px-3 border border-fuchsia-200 mt-1 mb-2 flex flex-col gap-3 animate-fade-in" onSubmit={handleCreateQR}>
            <span className="font-bold text-fuchsia-600 mb-1">Generate QR for Attendance</span>
            <input name="subject" className="border px-3 py-2 rounded-xl" placeholder="Subject"
                   onChange={e => setQRData(d=>({...d, subject:e.target.value}))} value={qrData.subject} required/>
            <input name="date" type="date" className="border px-3 py-2 rounded-xl"
                   onChange={e => setQRData(d=>({...d, date:e.target.value}))} value={qrData.date} required/>
            <input name="time" type="time" className="border px-3 py-2 rounded-xl"
                   onChange={e => setQRData(d=>({...d, time:e.target.value}))} value={qrData.time} required/>
            <button type="submit" className="px-4 py-2 mt-1 bg-fuchsia-600 text-white rounded-lg font-semibold hover:bg-fuchsia-700">Create & Show QR</button>
          </form>
          {qrOpen && qrData.subject && qrData.date && qrData.time && (
            <div className="flex flex-col items-center gap-2 bg-white border ring-2 ring-fuchsia-300 rounded-lg p-4 animate-scale-in mt-2 mb-3">
              <QRCodeCanvas value={`${qrData.subject}@${qrData.date}@${qrData.time}`} size={90}/>
              <span className="text-xs text-gray-400">QR for {qrData.subject}</span>
              <button className="text-xs text-fuchsia-500 underline mt-1" onClick={() => setQROpen(false)}>Close</button>
            </div>
          )}
          <div className="w-full my-3 rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-100 animate-fade-in">
            <span className="font-semibold text-indigo-700">Faculty Overview</span>
            {facultyList.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-3">No data available.</div>
            ) : (
              <ul className="mt-1 divide-y divide-indigo-100">
                {facultyList.map((f, i) => (
                  <li key={i} className="flex items-center justify-between py-1 text-sm">
                    <span>{f.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full mt-1 rounded-lg bg-fuchsia-50 px-3 py-2 border border-fuchsia-100 animate-fade-in">
            <span className="font-semibold text-fuchsia-700">Department Attendance</span>
            {deptAttendance.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-3">No data available.</div>
            ) : (
              <ul className="mt-2 divide-y divide-fuchsia-100">
                {deptAttendance.map((att, i) => (
                  <li key={i} className="flex justify-between py-1.5 items-center text-sm">
                    <span className="font-medium">{att.subject}</span>
                    <span className="font-semibold text-emerald-600">{Math.round(att.present / att.total * 100)}%</span>
                    <span className="text-xs text-gray-400">({att.present}/{att.total})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full mt-4 flex flex-col gap-3">
            <button className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold shadow hover:bg-indigo-700">
              <List className="inline-block mr-2" /> Generate Reports (PDF/CSV)
            </button>
            <button className="w-full bg-gray-50 border rounded-lg py-2 text-gray-600 hover:bg-gray-100">Download All Attendance Data</button>
          </div>
        </div>
        {showToast && (
          <div className="fixed left-1/2 bottom-10 transform -translate-x-1/2 bg-fuchsia-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg animate-fade-in">{showToast}</div>
        )}
      </div>
    </RoleGuard>
  );
}
