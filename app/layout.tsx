import type { Metadata } from "next";
import { Fraunces, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const malayalam = Noto_Sans_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "മുത്തശ്ശി കഥ — Muthashi Kadha",
  description:
    "Her story, her book, every child's library. Malayalam stories turned into illustrated books for children.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ml"
      className={`${display.variable} ${malayalam.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-[var(--ink)]">
        <div className="site-backdrop" aria-hidden="true">
          <div className="site-backdrop__fireflies">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="site-shell">{children}</div>
      </body>
    </html>
  );
}
