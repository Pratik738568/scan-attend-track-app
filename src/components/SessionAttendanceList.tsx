
import React, { useEffect, useState } from "react";
import { getAttendanceForFaculty } from "@/integrations/supabase/attendance";

interface SessionAttendanceListProps {
  subject: string;
  year: string;
  date: string;
  time: string;
}

export default function SessionAttendanceList(props: SessionAttendanceListProps) {
  const { subject, year, date, time } = props;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAttendanceForFaculty(date, year, subject)
      .then(data => {
        console.log("Attendance fetch:", { data, facultySession: { subject, year, date, time } });
        // Filter on time as well (since getAttendanceForFaculty doesn't include time)
        setRecords((data || []).filter(rec => rec.time === time));
      })
      .catch((err) => {
        console.log("Attendance fetch error:", err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [subject, year, date, time]);

  if (loading) return <div className="text-xs text-gray-400 p-2">Loading...</div>;
  if (records.length === 0) return <div className="text-xs text-gray-400 p-2">No attendance yet.</div>;

  return (
    <ul className="px-2 mt-1">
      {records.map((stu, i) => (
        <li key={stu.id || i} className="flex items-center justify-between gap-2 py-1 text-sm">
          <span>
            <span className="font-medium">{stu.student_name}</span>
            <span className="ml-2 text-gray-400 text-xs">({stu.student_id})</span>
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            Present
          </span>
        </li>
      ))}
    </ul>
  );
}
