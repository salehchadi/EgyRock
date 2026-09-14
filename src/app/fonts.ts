import { Anton, Oswald, Cairo, Almarai } from "next/font/google";

export const fontAnton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const fontOswald = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const fontCairo = Cairo({
  weight: ["600", "700", "800", "900"],
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const fontAlmarai = Almarai({
  weight: ["400", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-almarai",
  display: "swap",
});
