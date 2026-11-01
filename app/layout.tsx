import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { AppHeader } from "@/components/app-header";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "SyncTime - znajdźcie wspólny czas",
    template: "%s - SyncTime",
  },
  description:
    "Zaznacz dostępność, zaproś swoją ekipę i znajdź najlepszy wspólny termin spotkania.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`scheme-dark selection:bg-[#a28ce740] ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="m-0 flex min-h-full flex-col bg-background font-sans text-base leading-relaxed font-normal text-foreground antialiased has-[dialog[open]]:overflow-hidden">
        <Providers>
          <a
            className="fixed -top-17.5 left-3.75 z-300 rounded-md bg-[#b19cfc] p-3 text-[#17122b] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus:top-3.75 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
            href="#main-content"
          >
            Przejdź do treści
          </a>
          <AppHeader />
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
