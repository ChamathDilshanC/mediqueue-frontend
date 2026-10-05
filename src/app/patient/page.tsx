import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { PatientPortal } from "@/components/patient-portal";
export const metadata = { title: "Patient portal" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE))
    redirect("/patient/login");
  const params = await searchParams;
  const payment = Array.isArray(params.payment)
    ? params.payment[0]
    : params.payment;
  return (
    <PatientPortal
      paymentResult={
        payment === "success" || payment === "cancelled" ? payment : undefined
      }
    />
  );
}
