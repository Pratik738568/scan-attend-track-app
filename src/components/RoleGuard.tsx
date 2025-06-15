
import React from "react";
import { Navigate } from "react-router-dom";

type Props = { role: string, children: React.ReactNode };
export default function RoleGuard({ role, children }: Props) {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("qr_user") ?? "null"); }
    catch { return null; }
  })();
  if (!user || user.role !== role) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
