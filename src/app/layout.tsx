import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "goey-toast/styles.css";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_ORIGIN ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: { default: "MediQueue — ඔබේ කාලය වටිනවා", template: "%s | MediQueue" },
  description:
    "පහසු රෝහල් ගමනක් වෙනුවෙන්. Less waiting. More possibilities. Connect with your care through MediQueue.",
  icons: { icon: "/brand/logo.png", apple: "/brand/logo.png" },
  openGraph: {
    title: "MediQueue — Less waiting. More possibilities.",
    description: "A simpler, more connected healthcare journey.",
    images: ["/brand/logo.png"],
    locale: "si_LK",
    alternateLocale: "en_US",
    type: "website",
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language =
    (await cookies()).get("mq_language")?.value === "en" ? "en" : "si";
  return (
    <html lang={language} className={cn("font-sans", geist.variable)}>
      <body>
        <Providers initialLanguage={language}>{children}</Providers>
      </body>
    </html>
  );
}
