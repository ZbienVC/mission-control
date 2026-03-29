import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Control',
  description: "Zach's unified command board — kanban, agent monitoring, daily memory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-text-size-adjust: 100%; }
          body { background: #050817; color: #f8fbff; line-height: 1.6; }
          input, select, textarea, button { font-family: inherit; font-size: inherit; }
          h1, h2, h3, h4 { line-height: 1.25; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
