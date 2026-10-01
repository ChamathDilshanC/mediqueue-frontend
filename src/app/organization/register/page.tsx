import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrganizationRegistration } from "@/components/organization-registration";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";

export const metadata = { title: "Register a hospital or medical center" };

export default async function OrganizationRegisterPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/login");
  return <OrganizationRegistration />;
}
