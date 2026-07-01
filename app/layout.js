import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'SpellIELTS — IELTS Spelling & Dictation Practice',
  description: 'Master IELTS spelling with adaptive dictation, spaced repetition, error tracking, and exam-hall realism. The most advanced free IELTS spelling trainer.',
  keywords: 'IELTS spelling, dictation practice, IELTS vocabulary, spaced repetition, exam preparation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
