import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Patient sign in" };
export default function Page() {
  return <AuthForm mode="login" audience="patient" />;
}
