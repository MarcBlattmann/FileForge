import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'File Forge',
  description: 'No ads. No bullshit. Just file conversion.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
