import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider/auth-provider";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { PublishDialogHost } from "@/components/publish/publish-dialog-host";
import { SoundProvider } from "@/components/sound-provider/sound-provider";
import { TopNav } from "@/components/top-nav/top-nav";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-lt-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lt-display",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${dmSans.className} bg-[var(--lt-bg)] text-[var(--lt-ink)] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="lt-theme"
        >
          <AuthProvider>
            <SoundProvider>
              <OnboardingGate>
                <TopNav />
                {children}
                <PublishDialogHost />
              </OnboardingGate>
            </SoundProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
