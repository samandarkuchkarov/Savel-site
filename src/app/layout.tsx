import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Savel — крепкие отношения за 10 минут в неделю",
  description:
    "Savel помогает парам говорить о важном регулярно: еженедельный чек-ап, вопросы для двоих и ИИ-консультант, который знает контекст именно ваших отношений.",
  openGraph: {
    title: "Savel — приложение для двоих",
    description:
      "Еженедельный чек-ап, вопросы для двоих и ИИ-консультант для вашей пары. 10 минут в неделю.",
    type: "website",
    locale: "ru_RU",
    siteName: "Savel",
  },
};

export const viewport: Viewport = {
  themeColor: "#FEF8F3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
