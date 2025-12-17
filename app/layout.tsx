import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Juanttendify - School Attendance System',
  description: 'Monitor school attendance with QR code scanning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

