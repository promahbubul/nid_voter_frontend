import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata = {
  title: "NID Voter Web App",
  description: "Protected voter management dashboard with modern records and overview screens.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={`${hindSiliguri.variable} min-h-screen bg-[#071015] text-slate-100 antialiased`}>{children}</body>
    </html>
  );
}
