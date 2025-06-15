
// Utility functions for Attendance table operations

import { supabase } from "./client";

export async function insertAttendance(record: {
  student_id: string;
  student_name: string;
  subject: string;
  year: string;
  date: string; // "YYYY-MM-DD"
  time: string;
  qr_code_value?: string;
  marked_by?: string;
}) {
  const { data, error } = await supabase
    .from("attendance")
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAttendanceForStudent(student_id: string) {
  // Returns records for current student only (show respectively)
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", student_id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAttendanceForFaculty(date?: string, year?: string, subject?: string) {
  // Returns all records, filtered if requested
  let query = supabase.from("attendance").select("*");
  if (date) query = query.eq("date", date);
  if (year) query = query.eq("year", year);
  if (subject) query = query.eq("subject", subject);
  query = query.order("date", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateAttendanceMark(id: string, present: boolean) {
  // Mark by updating attendance row (if you want to track absent/present in future can add present col.)
  // For now, we just update marked_by field as a toggle; extend as needed.
  const { data, error } = await supabase
    .from("attendance")
    .update({ marked_by: present ? "faculty" : null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
