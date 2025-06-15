import { useState } from "react";
import { QrCode, Plus, View } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import RoleGuard from "@/components/RoleGuard";
import { useNavigate } from "react-router-dom";

type AttendanceSession = {
  id: string,
  subject: string,
  date: string,
  time: string,
  codeValue: string,
  students: { name: string, present: boolean }[]
};

const DEMO_SESSIONS_INIT: AttendanceSession[] = [
  {
    id: "1",
    subject: "Physics",
    date: "2025-06-14",
    time: "09:30",
    codeValue: "physics@2025-06-14@0930",
    students: [
      { name: "Student Sam", present: true },
      { name: "Jane Doe", present: false }
    ]
  }
];

export default function FacultyDashboard() {
  const [viewQR, setViewQR] = useState(false);
  const [qrData, setQRData] = useState({ subject: "", date: "", time: "" });
  const [sessions, setSessions] = useState(DEMO_SESSIONS_INIT);
  const [showNew, setShowNew] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [sessionFilterDays, setSessionFilterDays] = useState(15);
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("qr_user");
    navigate("/auth");
  }

  function handleOpenQRForm() {
    setShowNew(true);
    setQRData({ subject: "", date: "", time: "" });
  }

  function handleQRFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setQRData(d => ({ ...d, [name]: value }));
  }

  function handleGenerateQR(e: React.FormEvent) {
    e.preventDefault();
    if (!qrData.subject || !qrData.date || !qrData.time) {
      setShowToast("All fields required.");
      return;
    }
    // For demo, create unique code value
    const codeValue = `${qrData.subject}@${qrData.date}@${qrData.time}`;
    setSessions(ses => [
      {
        id: `${Date.now()}`,
        subject: qrData.subject,
        date: qrData.date,
        time: qrData.time,
        codeValue,
        students: [
          { name: "Student Sam", present: false },
          { name: "Jane Doe", present: false }
        ]
      },
      ...ses
    ]);
    setShowNew(false);
    setShowToast("QR Code generated!");
  }

  function handleToggleAttendance(sessionIdx: number, i: number) {
    setSessions(s =>
      s.map((ses, idx) =>
        idx === sessionIdx
          ? {
              ...ses,
              students: ses.students.map((stu, j) =>
                i === j ? { ...stu, present: !stu.present } : stu
              )
            }
          : ses
      )
    );
  }

  // Generate CSV for all attendance sessions
  function handleGenerateReport() {
    if (!sessions.length) {
      setShowToast("No sessions to report.");
      return;
    }
    // Header row
    let csv = "Session ID,Subject,Date,Time,Student Name,Present\n";
    sessions.forEach((session) => {
      session.students.forEach((stu) => {
        csv += [
          session.id,
          `"${session.subject}"`,
          session.date,
          session.time,
          `"${stu.name}"`,
          stu.present ? "Yes" : "No",
        ].join(",") + "\n";
      });
    });

    // Trigger download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowToast("Report downloaded!");
  }

  return (
    <RoleGuard role="faculty">
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-indigo-100 flex flex-col items-center px-2 pt-4">
        <header className="mb-2 w-full flex items-center justify-between px-2">
          <span className="font-semibold text-indigo-700 text-xl flex items-center gap-2">
            <QrCode className="w-7 h-7" /> Faculty Dashboard
          </span>
          <button className="py-1 px-4 text-xs rounded bg-indigo-200 hover:bg-indigo-300 ml-2 font-medium" onClick={handleLogout}>Logout</button>
        </header>
        <div className="w-full max-w-lg bg-white rounded-xl shadow-xl px-6 py-7 flex flex-col gap-5 items-center">
          <button onClick={handleOpenQRForm} className="w-full flex items-center justify-center py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold shadow-md hover-scale">
            <Plus className="mr-2 w-7 h-7"/> Generate QR for Attendance
          </button>
          {/* New: Generate Report button */}
          <button
            onClick={handleGenerateReport}
            className="w-full py-3 mt-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold shadow-lg border border-emerald-400 transition"
          >
            Generate Attendance Report (CSV)
          </button>
          {showNew && (
            <form className="w-full bg-indigo-50 border border-indigo-100 rounded-lg py-4 px-3 mb-3 flex flex-col gap-3 animate-fade-in" onSubmit={handleGenerateQR}>
              <input name="subject" className="border px-3 py-2 rounded-xl" placeholder="Subject" onChange={handleQRFormChange} value={qrData.subject} required/>
              <input name="date" type="date" className="border px-3 py-2 rounded-xl" onChange={handleQRFormChange} value={qrData.date} required/>
              <input name="time" type="time" className="border px-3 py-2 rounded-xl" onChange={handleQRFormChange} value={qrData.time} required/>
              <button type="submit" className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Create & Show QR</button>
              <button type="button" className="text-xs mt-2 text-gray-500 underline" onClick={() => setShowNew(false)}>Cancel</button>
            </form>
          )}

          <div className="w-full flex justify-between items-center mt-1">
            <span className="font-semibold text-indigo-700">Session History</span>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">Filter:</span>
              <button className={sessionFilterDays === 15 ? "font-bold text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400"} onClick={()=>setSessionFilterDays(15)}>15 days</button>
              <button className={sessionFilterDays === 30 ? "font-bold text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400"} onClick={()=>setSessionFilterDays(30)}>30 days</button>
            </div>
          </div>
          <div className="w-full rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 overflow-y-auto max-h-80 mt-2">
            {sessions.length === 0 ? (
              <div className="text-gray-500 py-5 text-center">No sessions yet.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {sessions.slice(0, sessionFilterDays).map((ses, idx) => (
                  <li key={ses.id} className="rounded-lg shadow bg-white border flex flex-col py-2 px-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-700">{ses.subject}</span>
                      <span className="text-xs text-gray-500">{ses.date} at {ses.time}</span>
                    </div>
                    <div className="my-2 flex flex-col gap-1">
                      <details>
                        <summary className="cursor-pointer hover:underline text-sm">
                          Student Attendance ({ses.students.length})
                        </summary>
                        <ul className="px-2 mt-1">
                          {ses.students.map((stu, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 py-1 text-sm">
                              <span className="">{stu.name}</span>
                              <button
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${stu.present ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}
                                onClick={() => handleToggleAttendance(idx, i)}
                              >
                                {stu.present ? "Present" : "Absent"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">QR:</span>
                      <QRCodeCanvas value={ses.codeValue} size={60}/>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {showToast && (
          <div className="fixed left-1/2 bottom-10 transform -translate-x-1/2 bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg animate-fade-in">{showToast}</div>
        )}
      </div>
    </RoleGuard>
  );
}
