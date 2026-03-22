'use client'

import { AuthProvider } from '@/lib/auth/AuthContext'
import { ModalProvider } from '@/lib/context/ModalContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </AuthProvider>
  )
}
