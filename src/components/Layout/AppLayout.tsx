/**
 * ============================================
 * APP LAYOUT - Shell com Sidebar + Header
 * ============================================
 * Data: 2026-02-13
 * Layout principal que envolve todas as rotas
 * protegidas com Sidebar colapsável e Header.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Header */}
      <Header collapsed={collapsed} />

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
