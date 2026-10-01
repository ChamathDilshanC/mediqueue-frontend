import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata = { title: "Admin dashboard" };

export default async function AdminPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/login");
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  );
}
