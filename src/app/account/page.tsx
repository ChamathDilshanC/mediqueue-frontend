import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Account } from "@/components/account";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
export const metadata = { title: "My account" };
export default async function AccountPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/login");
  return <Account />;
}
