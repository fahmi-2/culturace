'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Timer, Search, ArrowLeft, RefreshCw, Flame, MapPin, Sparkles } from 'lucide-react'

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [wave, setWave] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [elapsed, setElapsed] = useState('00:00:00')

  const fetchLeaderboard = () => {
    fetch('/api/leaderboard?category=5K')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || [])
        setWave(data.wave)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  // Timer Realtime
  useEffect(() => {
    fetchLeaderboard()
    const poll = setInterval(fetchLeaderboard, 4000)
    const timer = setInterval(() => {
      if (wave && wave.is_started && wave.gun_start_time) {
        const start = new Date(wave.gun_start_time).getTime()
        const now = Date.now()
        const diff = Math.max(0, now - start)

        const totalSec = Math.floor(diff / 1000)
        const h = Math.floor(totalSec / 3600)
        const m = Math.floor((totalSec % 3600) / 60)
        const s = totalSec % 60

        setElapsed(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        )
      }
    }, 1000)

    return () => {
      clearInterval(poll)
      clearInterval(timer)
    }
  }, [wave?.gun_start_time, wave?.is_started])

  const filteredRunners = leaderboard.filter(r =>
    (r.runner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.bib_number || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#1f2024] font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-[#fffdfa] border-b border-[#eee6df] px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#a91024] hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[11px] font-bold text-emerald-800 tracking-wider">
            LIVE UPDATING
          </span>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-[#3a0a18] via-[#8e1025] to-[#c51e35] text-white py-12 px-6 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1 bg-[#f3ba61] text-[#3a0a18] font-mono font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase mb-3">
              <Flame className="w-3.5 h-3.5 fill-current" /> OFFICIAL RESULTS & LIVE STANDINGS
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Leaderboard 5K Fun Run
            </h1>
            <p className="text-xs sm:text-sm text-[#f7dfe0] mt-2 max-w-lg leading-relaxed">
              Culturace 2026 · Masjid Moekhlas Sidik Race Edition Pandaan, Pasuruan.
            </p>
          </div>

          {/* Stopwatch Pill */}
          <div className="bg-[#20060e]/80 border-2 border-[#f3ba61]/40 backdrop-blur-md px-6 py-4 rounded-2xl text-center shadow-2xl">
            <span className="text-[10px] font-mono text-[#f3ba61] tracking-widest uppercase block mb-1">
              {wave?.is_started ? 'OFFICIAL RACE CLOCK' : 'STATUS PERLOMBAAN'}
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white">
              {wave?.is_started ? elapsed : 'READY TO START'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Content */}
      <main className="max-w-5xl mx-auto py-10 px-6 sm:px-8 space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e5ded7] shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-[#8a7772]" />
          <input
            type="text"
            placeholder="Cari nama pelari atau nomor BIB (contoh: 5K-001)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm outline-none font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-[#8a7772] hover:text-black">
              Bersihkan
            </button>
          )}
        </div>

        {/* Podium Top 3 Pelari */}
        {filteredRunners.length >= 3 && !search && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2">
            {/* Runner 2 (Silver) */}
            <div className="bg-white rounded-2xl border border-[#e5ded7] p-5 flex flex-col items-center text-center shadow-xs order-2 md:order-1">
              <span className="w-10 h-10 rounded-full bg-stone-200 text-stone-700 font-black font-mono text-sm flex items-center justify-center mb-2 shadow-sm">
                2
              </span>
              <span className="font-mono font-black text-sm text-[#a91024]">{filteredRunners[1].bib_number}</span>
              <h3 className="font-bold text-sm text-[#1f2024] mt-1">{filteredRunners[1].runner_name}</h3>
              <span className="mt-3 font-mono font-black text-lg text-[#1f2024] bg-[#faf6f2] px-4 py-1 rounded-xl border border-[#eee5dc]">
                {filteredRunners[1].formatted_duration}
              </span>
            </div>

            {/* Runner 1 (Gold) */}
            <div className="bg-gradient-to-b from-[#fffbf2] to-white rounded-2xl border-2 border-[#f3ba61] p-6 flex flex-col items-center text-center shadow-md order-1 md:order-2 -translate-y-2">
              <div className="w-12 h-12 rounded-full bg-[#f3ba61] text-[#210810] font-black font-mono text-base flex items-center justify-center mb-2 shadow-md">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-[#a91024] font-bold uppercase">CHAMPION 5K</span>
              <span className="font-mono font-black text-base text-[#a91024] mt-1">{filteredRunners[0].bib_number}</span>
              <h3 className="font-black text-base text-[#1f2024] mt-1">{filteredRunners[0].runner_name}</h3>
              <span className="mt-3 font-mono font-black text-2xl text-[#a91024] bg-red-50 px-5 py-1.5 rounded-xl border border-red-200">
                {filteredRunners[0].formatted_duration}
              </span>
            </div>

            {/* Runner 3 (Bronze) */}
            <div className="bg-white rounded-2xl border border-[#e5ded7] p-5 flex flex-col items-center text-center shadow-xs order-3 md:order-3">
              <span className="w-10 h-10 rounded-full bg-amber-700 text-white font-black font-mono text-sm flex items-center justify-center mb-2 shadow-sm">
                3
              </span>
              <span className="font-mono font-black text-sm text-[#a91024]">{filteredRunners[2].bib_number}</span>
              <h3 className="font-bold text-sm text-[#1f2024] mt-1">{filteredRunners[2].runner_name}</h3>
              <span className="mt-3 font-mono font-black text-lg text-[#1f2024] bg-[#faf6f2] px-4 py-1 rounded-xl border border-[#eee5dc]">
                {filteredRunners[2].formatted_duration}
              </span>
            </div>
          </div>
        )}

        {/* Tabel Lengkap */}
        <div className="bg-white rounded-2xl border border-[#e5ded7] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#faf6f2] border-b border-[#e5ded7] text-[#8a7772] font-mono text-[10px] uppercase">
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">BIB</th>
                  <th className="py-3 px-4">Nama Pelari</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Official Net Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6dd]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8a7772]">
                      Memuat hasil leaderboard...
                    </td>
                  </tr>
                ) : filteredRunners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8a7772]">
                      {search ? 'Tidak ada pelari yang sesuai pencarian.' : 'Belum ada pelari yang melintasi garis finish.'}
                    </td>
                  </tr>
                ) : (
                  filteredRunners.map((r, index) => {
                    const rank = index + 1
                    return (
                      <tr key={r.id} className="hover:bg-[#fffaf5] transition">
                        <td className="py-3.5 px-4 text-center font-mono font-black text-xs text-[#8a7772]">
                          #{rank}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-sm text-[#a91024]">
                          {r.bib_number}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-sm text-[#1f2024]">
                          {r.runner_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#716f70]">
                          5K Fun Run
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-black text-sm text-[#a91024] bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                            {r.formatted_duration}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
