import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import PopupBanner from '@/components/PopupBanner';
import NavbarClient from '@/components/NavbarClient';
import ScrollToTop from '@/components/ScrollToTop';
import { LocaleProvider } from '@/components/LocaleProvider';
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DBOD - Dragon Ball Online Daebak",
  description: "Dragon Ball Online Daebak - Official Website",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('siteLocale')?.value;
  const initialLocale = savedLocale === 'kr' ? 'kr' : 'en';

  return (
    <html lang={initialLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LocaleProvider initialLocale={initialLocale}>
          <Toaster />
          <PopupBanner />
          <NavbarClient />
          <ScrollToTop />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
