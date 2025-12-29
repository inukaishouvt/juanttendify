import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
});

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
      <body
        className={quicksand.variable}
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        {children}
      </body>
    </html>
  );
}

