import type { Metadata } from "next";
import { fontAnton, fontOswald, fontCairo, fontAlmarai } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "EgyRock — Cairo Underground",
  description: "Alternative Egyptian rock-music streetwear and physical course merchandise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontAnton.variable} ${fontOswald.variable} ${fontCairo.variable} ${fontAlmarai.variable}`}
    >
      <body className="bg-[#1c1a17] text-[#f2ede4] font-body min-h-screen antialiased selection:bg-[#e0562c] selection:text-white">
        {children}
      </body>
    </html>
  );
}
