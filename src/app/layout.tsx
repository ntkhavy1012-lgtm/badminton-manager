import React from "react";
import "./globals.css";

export const metadata = {
  title: "Badminton Manager",
  description: "Quản lý lịch sử thi đấu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}