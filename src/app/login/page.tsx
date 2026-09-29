import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const { auth_error } = await searchParams;
  const allowed = [
    "googleCancelled",
    "googleExpired",
    "googleFailed",
    "rateLimit",
  ] as const;
  const error = allowed.find((value) => value === auth_error) ?? null;
  return <AuthForm mode="login" initialError={error} />;
}
