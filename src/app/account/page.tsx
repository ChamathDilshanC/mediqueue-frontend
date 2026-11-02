import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Account } from "@/components/account";
import {
  ACCESS_COOKIE,
  AUDIENCE_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth-server";
export const metadata = { title: "My account" };
export default async function AccountPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/login");
  return <Account staff={jar.get(AUDIENCE_COOKIE)?.value === "staff"} />;
}
