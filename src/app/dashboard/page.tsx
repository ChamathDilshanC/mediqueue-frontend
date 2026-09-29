import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { Dashboard } from "@/components/dashboard";

export const metadata = { title: "Operations dashboard" };

export default async function DashboardPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/login");
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
