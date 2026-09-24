'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, QrCode, Timer, ExternalLink, ArrowLeft } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Ringkasan (Overview)', href: '/admin', icon: LayoutDashboard },
    { name: 'Data Peserta', href: '/admin/participants', icon: Users },
    { name: 'Monitoring Pembayaran', href: '/admin/payments', icon: CreditCard },
    { name: 'Scanner Panitia', href: '/admin/scanner', icon: QrCode },
    { name: 'Race Timing & Finish', href: '/admin/timing', icon: Timer },
  ]

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1f2024] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1b1718] text-[#e8ded6] shrink-0 border-r border-[#2b2526] flex flex-col">
        <div className="p-6 border-b border-[#2b2526]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#a91024] text-white flex items-center justify-center font-serif font-black text-lg shadow-md">
              C
            </span>
            <div>
              <h1 className="font-black text-base tracking-tight text-white">PANITIA CULTURACE</h1>
              <span className="font-mono text-[9px] tracking-wider text-[#d9a33c] uppercase block">
                RACE MANAGEMENT SYSTEM
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${isActive
                    ? 'bg-[#a91024] text-white font-semibold shadow-sm'
                    : 'text-[#baa79d] hover:bg-[#252021] hover:text-white'
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#8a7772]'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Links Footer */}
        <div className="p-4 border-t border-[#2b2526] space-y-2 text-[11px]">
          <Link
            href="/leaderboard"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#252021] text-[#f2bb5a] hover:bg-[#302a2b] transition"
          >
            <span>Live Leaderboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#baa79d] hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#e5ded7] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#8a7772]">Masjid Merah Moekhlas Sidik RACE EDITION 2026</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM ONLINE
            </span>
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
