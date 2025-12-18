import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "image2cpp - Convert images to byte arrays",
  description: "A simple tool to change images into byte arrays for use with monochrome displays such as OLEDs on your Arduino or Raspberry Pi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
