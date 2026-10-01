import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";

export default async function Home() {
  const store = await cookies();
  if (store.has(ACCESS_COOKIE) || store.has(REFRESH_COOKIE)) {
    redirect("/account");
  }
  return <Landing />;
}
