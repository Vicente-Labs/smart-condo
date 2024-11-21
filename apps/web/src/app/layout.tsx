import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Condo',
  description:
    'Smart Condo is a open-source platform for managing condominiums',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
