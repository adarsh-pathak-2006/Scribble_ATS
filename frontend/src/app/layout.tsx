import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Skribbl ATS Resume AI - Intelligent Resume Scanner & Optimizer',
  description:
    'Analyze your resume against any job description, compute ATS match scores, discover missing keywords, and generate ATS-optimized resumes with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
