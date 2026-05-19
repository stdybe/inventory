'use client'

import { ReactNode } from 'react'

interface MobileContainerProps {
  children: ReactNode
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background">
      {children}
    </div>
  )
}
