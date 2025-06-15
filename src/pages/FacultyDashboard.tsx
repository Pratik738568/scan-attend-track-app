import { useState, useEffect } from "react";
import { QrCode, Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import RoleGuard from "@/components/RoleGuard";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Import Select UI components
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAttendanceForFaculty } from "@/integrations/supabase/attendance";
import SessionAttendanceList from "@/components/SessionAttendanceList";

type AttendanceSession = {
  id: string,
  subject: string,
  year: string,
  date: string,
  time: string,
  codeValue: string,
};

const DEMO_SESSIONS_INIT: AttendanceSession[] = [
  {
    id: "1",
    subject: "Physics",
    year: "Third Year",
    date: "2025-06-14",
    time: "09:30",
    codeValue: "physics@2025-06-14@0930"
  }
];

// Academic years and subjects mapping
const YEAR_SUBJECTS: Record<string, string[]> = {
  "Third Year": [
    "Compiler Design",
    "Computer Network",
    "Development Engineering",
    "Machine Learning",
    "GIS",
  ],
  // All other years intentionally left without subjects!
};
// List of available years
const ACADEMIC_YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
];

// Helper: get current date in YYYY-MM-DD format
function getToday() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
function toDate(val: string) {
  // Converts 'YYYY-MM-DD' string to Date instance
  const [y, m, d] = val.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function parseIsoDate(val: string) {
  // Converts 'YYYY-MM-DD' string to Date instance
  const [y, m, d] = val.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function dateToIso(date: Date) {
  // Converts Date -> 'YYYY-MM-DD'
  return date.toISOString().split("T")[0];
}

export default function FacultyDashboard() {
  const [viewQR, setViewQR] = useState(false);

  // qrData: add year and subject, subject will be selected only after year is selected
  const [qrData, setQRData] = useState<{ year: string; subject: string; date: string; time: string }>({ year: "", subject: "", date: getToday(), time: "" });

  // Remove DEMO_SESSIONS_INIT as the primary data source, use sessionsFromAttendance
  const [manualSessions, setManualSessions] = useState<AttendanceSession[]>([]); // for sessions with no attendance yet
  const [showNew, setShowNew] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [sessionFilterDays, setSessionFilterDays] = useState(15);
  const navigate = useNavigate();

  // Date range state for report
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  // Real attendance records from Supabase
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // "Sessions" in history, built from attendance
  const [sessionsFromAttendance, setSessionsFromAttendance] = useState<AttendanceSession[]>([]);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSession, setQRSession] = useState<AttendanceSession | null>(null);

  function handleLogout() {
    localStorage.removeItem("qr_user");
    navigate("/auth");
  }

  function handleOpenQRForm() {
    setShowNew(true);
    setQRData({ year: "", subject: "", date: getToday(), time: "" });
  }

  // Only allow time changes; year/subject are handled via Selects, date is always today
  function handleQRTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value } = e.target;
    setQRData(d => ({ ...d, time: value }));
  }

  // Remove all references to .students in the session list
  // Only new sessions (when QR is generated) need subject/year/date/time for history
  function handleGenerateQR(e: React.FormEvent) {
    e.preventDefault();
    const today = getToday();
    if (!qrData.year || !qrData.subject || !qrData.time) {
      setShowToast("All fields required.");
      return;
    }
    // Always use today's date for the code value and session
    const codeValue = `${qrData.subject}@${today}@${qrData.time}`;
    const newSession: AttendanceSession = {
      id: `${Date.now()}`, // temporary id
      subject: qrData.subject,
      year: qrData.year,
      date: today,
      time: qrData.time,
      codeValue,
    };
    // Add to manualSessions if this session (subject, year, date, time) doesn't exist in attendance db yet
    setManualSessions(ses => [
      newSession,
      ...ses
    ]);
    setShowNew(false);
    setShowQRModal(true);
    setQRSession(newSession);
    setShowToast(null); // Don't show success toast since we'll show QR modal
  }

  // When attendance records change, derive unique sessions from attendance DB and merge recent manual QR codes
  useEffect(() => {
    // Group attendance by (subject, year, date, time)
    const sessionsMap: Record<string, AttendanceSession> = {};
    attendance.forEach(a => {
      const key = `${a.subject}||${a.year}||${a.date}||${a.time}`;
      if (!sessionsMap[key]) {
        sessionsMap[key] = {
          id: a.id || key,
          subject: a.subject,
          year: a.year,
          date: a.date,
          time: a.time,
          codeValue: `${a.subject}@${a.date}@${a.time}`,
        }
      }
    });
    // Add sessions from manualSessions that are not in sessionsMap
    manualSessions.forEach(ses => {
      const key = `${ses.subject}||${ses.year}||${ses.date}||${ses.time}`;
      if (!sessionsMap[key]) {
        sessionsMap[key] = ses;
      }
    });
    // Convert map to sorted list (newest first)
    const sessionsArr = Object.values(sessionsMap).sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.time || "").localeCompare(a.time || "");
    });
    setSessionsFromAttendance(sessionsArr);
  }, [attendance, manualSessions]);

  // On component mount, fetch all attendance records from Supabase
  useEffect(() => {
    setLoadingAttendance(true);
    getAttendanceForFaculty()
      .then(data => setAttendance(data || []))
      .catch(() => setAttendance([]))
      .finally(() => setLoadingAttendance(false));
  }, []);

  // Filtered sessions for report, based on fromDate/toDate
  const filteredSessionsForReport = sessionsFromAttendance.filter(session => {
    if (!fromDate && !toDate) return true;
    const sessionDt = parseIsoDate(session.date);
    if (fromDate && sessionDt < fromDate) return false;
    if (toDate && sessionDt > toDate) return false;
    return true;
  });

  function handleGenerateReport() {
    if (!filteredSessionsForReport.length) {
      setShowToast("No sessions to report in range.");
      return;
    }
    // Header row
    let csv = "Session ID,Subject,Date,Time,Student Name,Present\n";
    filteredSessionsForReport.forEach((session) => {
      // session.students.forEach((stu) => { // REMOVE
      //   csv += [
      //     session.id,
      //     `"${session.subject}"`,
      //     session.date,
      //     session.time,
      //     `"${stu.name}"`,
      //     stu.present ? "Yes" : "No",
      //   ].join(",") + "\n";
      // });
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
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl px-6 py-7 flex flex-col gap-5 items-center">
          <div className="w-full flex flex-row items-center justify-between">
            <span className="font-semibold text-indigo-700 text-xl flex items-center gap-2">
              <QrCode className="w-7 h-7" /> Faculty Dashboard
            </span>
            <button className="py-1 px-4 text-xs rounded bg-indigo-200 hover:bg-indigo-300 ml-2 font-medium" onClick={handleLogout}>Logout</button>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full items-center justify-center mt-2">
            <span className="font-semibold text-sm text-indigo-800">Report range:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="md:w-[150px] w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-80" />
                  {fromDate ? format(fromDate, "yyyy-MM-dd") : <span>From Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={date => !!toDate && date > toDate}
                />
              </PopoverContent>
            </Popover>
            <span className="text-gray-500 hidden md:inline-block">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="md:w-[150px] w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-80" />
                  {toDate ? format(toDate, "yyyy-MM-dd") : <span>To Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={date => !!fromDate && date < fromDate}
                />
              </PopoverContent>
            </Popover>
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs ml-1"
                onClick={() => {
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
              >
                Reset
              </Button>
            )}
          </div>

          {/* New: Generate Report button */}
          <button
            onClick={handleGenerateReport}
            className="w-full py-3 mt-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold shadow-lg border border-emerald-400 transition"
          >
            Generate Attendance Report (CSV)
          </button>

          {/* New QR Modal/Section when QR is generated */}
          {showQRModal && qrSession && (
            <div className="fixed top-0 left-0 w-full h-full z-30 flex items-center justify-center bg-black/40 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-5 min-w-[300px] max-w-full mx-2 relative">
                <h2 className="font-bold text-xl text-indigo-700 mb-2 flex items-center gap-2">
                  <QrCode className="w-7 h-7" /> Attendance QR
                </h2>
                <div className="flex flex-col items-center">
                  <span className="text-indigo-700 font-semibold mb-1">{qrSession.subject}</span>
                  <span className="text-gray-400 text-sm mb-2">{qrSession.date} {qrSession.time && <>@ {qrSession.time}</>}</span>
                  {/* Big QR */}
                  <div className="p-4 bg-indigo-50 rounded-xl border">
                    <QRCodeCanvas value={qrSession.codeValue} size={200} includeMargin={true}/>
                  </div>
                </div>
                {/* Attendance List for this session */}
                <div className="mt-4 w-full">
                  <h3 className="font-semibold text-md text-indigo-800 mb-2">Student Attendance</h3>
                  <SessionAttendanceList
                    subject={qrSession.subject}
                    year={qrSession.year}
                    date={qrSession.date}
                    time={qrSession.time}
                  />
                </div>
                <Button
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                  onClick={() => setShowQRModal(false)}
                  type="button"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* New: QR generation form (uses Select for year/subject) */}
          <button
            className="w-full flex justify-center items-center py-3 mb-2 rounded-xl bg-indigo-600 text-white text-lg font-bold shadow-md hover-scale"
            onClick={handleOpenQRForm}
          >
            <QrCode className="mr-2 w-6 h-6" /> Create Attendance QR Code
          </button>
          {showNew && (
            <form
              className="w-full bg-indigo-50 border border-indigo-100 rounded-lg py-4 px-3 mb-3 flex flex-col gap-3 animate-fade-in"
              onSubmit={handleGenerateQR}
            >
              {/* Academic Year selection */}
              <div>
                <label className="font-medium text-sm mb-1 block" htmlFor="select-year">
                  Academic Year
                </label>
                <Select
                  value={qrData.year}
                  onValueChange={val => {
                    setQRData(d => ({
                      ...d,
                      year: val,
                      subject: "" // reset subject if year changes
                    }));
                  }}
                >
                  <SelectTrigger id="select-year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject selection: only enabled for Third Year. Show a message otherwise */}
              <div>
                <label className="font-medium text-sm mb-1 block" htmlFor="select-subject">
                  Subject
                </label>
                <Select
                  value={qrData.subject}
                  onValueChange={val => setQRData(d => ({ ...d, subject: val }))}
                  disabled={qrData.year !== "Third Year"}
                >
                  <SelectTrigger id="select-subject">
                    <SelectValue
                      placeholder={
                        qrData.year === "Third Year"
                          ? "Select Subject"
                          : "No subjects available for this year."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {qrData.year === "Third Year" ? (
                      YEAR_SUBJECTS["Third Year"].map(sub => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-gray-400 text-sm">
                        No subjects available for this year.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <input
                name="date"
                type="date"
                className="border px-3 py-2 rounded-xl bg-gray-100"
                value={getToday()}
                readOnly
                required
              />
              <input
                name="time"
                type="time"
                className="border px-3 py-2 rounded-xl"
                onChange={handleQRTimeChange}
                value={qrData.time}
                required
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Create & Show QR
              </button>
              <button
                type="button"
                className="text-xs mt-2 text-gray-500 underline"
                onClick={() => setShowNew(false)}
              >
                Cancel
              </button>
            </form>
          )}

          {/* Session History */}
          <div className="w-full flex justify-between items-center mt-1">
            <span className="font-semibold text-indigo-700">Session History</span>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">Filter:</span>
              <button className={sessionFilterDays === 15 ? "font-bold text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400"} onClick={()=>setSessionFilterDays(15)}>15 days</button>
              <button className={sessionFilterDays === 30 ? "font-bold text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400"} onClick={()=>setSessionFilterDays(30)}>30 days</button>
            </div>
          </div>
          <div className="w-full rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 overflow-y-auto max-h-80 mt-2">
            {sessionsFromAttendance.length === 0 ? (
              <div className="text-gray-500 py-5 text-center">No sessions yet.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {sessionsFromAttendance.slice(0, sessionFilterDays).map((ses, idx) => (
                  <li key={ses.id} className="rounded-lg shadow bg-white border flex flex-col py-2 px-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-700">{ses.subject}</span>
                      <span className="text-xs text-gray-500">{ses.date} at {ses.time}</span>
                    </div>
                    <div className="my-2 flex flex-col gap-1">
                      <details>
                        <summary className="cursor-pointer hover:underline text-sm">
                          Student Attendance
                        </summary>
                        <SessionAttendanceList
                          subject={ses.subject}
                          year={ses.year}
                          date={ses.date}
                          time={ses.time}
                        />
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
        <div className="w-full mt-4">
            <h3 className="text-lg font-semibold mb-2">Attendance Records</h3>
            <div className="text-gray-400 py-6 text-center">
              Attendance records are currently not displayed.
            </div>
        </div>
        {showToast && (
          <div className="fixed left-1/2 bottom-10 transform -translate-x-1/2 bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg animate-fade-in">{showToast}</div>
        )}
      </div>
    </RoleGuard>
  );
}
