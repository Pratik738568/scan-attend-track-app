
import React, { useEffect, useState } from "react";
import { getAttendanceForFaculty, updateAttendanceMark } from "@/integrations/supabase/attendance";
import { Check, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAttendanceForFaculty(date, year, subject)
      .then(data => {
        // Normalize fields and log for debugging
        const normalizedUiTime = (time ?? "").trim().toLowerCase();
        const normalizedUiSubject = (subject ?? "").trim().toLowerCase();
        const normalizedUiYear = (year ?? "").trim().toLowerCase();
        const normalizedUiDate = (date ?? "").trim();

        const normalizedRecords = (data || []).filter(rec => {
          // Defensive: trim and lowercase everything
          const recTime = (rec.time ?? "").trim().toLowerCase();
          const recSubject = (rec.subject ?? "").trim().toLowerCase();
          const recYear = (rec.year ?? "").trim().toLowerCase();
          const recDate = (rec.date ?? "").trim();

          return (
            recTime === normalizedUiTime &&
            recSubject === normalizedUiSubject &&
            recYear === normalizedUiYear &&
            recDate === normalizedUiDate
          );
        });

        setRecords(normalizedRecords);
      })
      .catch((err) => {
        console.log("Attendance fetch error:", err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [subject, year, date, time]);

  const handleTogglePresent = async (id: string, present: boolean) => {
    setUpdatingId(id);
    try {
      const updated = await updateAttendanceMark(id, !present);
      setRecords(recs =>
        recs.map(r =>
          r.id === id ? { ...r, marked_by: updated.marked_by } : r
        )
      );
    } catch (error) {
      console.error("Failed to update attendance mark", error);
      // Optionally: toast message here
    }
    setUpdatingId(null);
  };

  if (loading)
    return <div className="text-xs text-gray-400 p-2">Loading...</div>;
  if (records.length === 0)
    return <div className="text-xs text-gray-400 p-2">No attendance yet.</div>;

  return (
    <ul className="px-2 mt-1">
      {records.map((stu, i) => {
        const isPresent = stu.marked_by === "faculty";
        return (
          <li key={stu.id || i} className="flex items-center justify-between gap-2 py-1 text-sm">
            <span>
              <span className="font-medium">{stu.student_name}</span>
              <span className="ml-2 text-gray-400 text-xs">({stu.student_id})</span>
            </span>
            <button
              className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold border transition
                ${isPresent
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-red-100 text-red-700 border-red-200'}
                ${updatingId === stu.id ? 'opacity-60 cursor-wait' : 'hover:shadow'}
              `}
              disabled={updatingId === stu.id}
              onClick={() => handleTogglePresent(stu.id, isPresent)}
              title="Toggle Present/Absent"
            >
              {updatingId === stu.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPresent ? (
                <>
                  <Check className="w-4 h-4" /> Present
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" /> Absent
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
