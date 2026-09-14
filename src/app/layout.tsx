import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EgyRock",
  description: "Cairo Underground Rock Music & Streetwear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
