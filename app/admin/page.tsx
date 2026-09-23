'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, CheckCircle2, Clock, DollarSign, ArrowUpRight, Trophy, QrCode } from 'lucide-react'
import Link from 'next/link'

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    fetch('/api/admin/overview')
      .then(res => res.json())
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatIDR = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0)

  if (loading && !data) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#a91024] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-mono text-xs text-[#8a7772]">Memuat ringkasan data panitia...</p>
      </div>
    )
  }

  const stats = data?.stats || {}
  const recentOrders = data?.recentOrders || []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-[#1f2024] tracking-tight">Ringkasan Event Culturace 2026</h2>
        <p className="text-xs text-[#716f70] mt-1">Monitoring pendaftaran, transaksi pembayaran, race pack, dan live timing.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Pendapatan */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5ded7] shadow-xs">
          <div className="flex justify-between items-center text-[#8a7772]">
            <span className="text-xs font-semibold uppercase font-mono">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#1f2024] mt-2">
            Rp {formatIDR(stats.total_revenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> {stats.paid_orders || 0} Pembayaran Berhasil
          </span>
        </div>

        {/* Peserta Resmi */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5ded7] shadow-xs">
          <div className="flex justify-between items-center text-[#8a7772]">
            <span className="text-xs font-semibold uppercase font-mono">Peserta Resmi (BIB)</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#a91024] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#1f2024] mt-2">
            {stats.total_tickets || 0} Pelari
          </div>
          <span className="text-[11px] text-[#716f70] mt-1 block">
            Kategori 5K Fun Run
          </span>
        </div>

        {/* Race Pack Terambil */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5ded7] shadow-xs">
          <div className="flex justify-between items-center text-[#8a7772]">
            <span className="text-xs font-semibold uppercase font-mono">Race Pack Terambil</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#1f2024] mt-2">
            {stats.racepack_taken_count || 0} <span className="text-sm font-normal text-[#8a7772]">/ {stats.total_tickets || 0}</span>
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">
            {stats.total_tickets ? Math.round(((stats.racepack_taken_count || 0) / stats.total_tickets) * 100) : 0}% Distribusi Selesai
          </span>
        </div>

        {/* Check-in & Finish */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5ded7] shadow-xs">
          <div className="flex justify-between items-center text-[#8a7772]">
            <span className="text-xs font-semibold uppercase font-mono">Pelari Finish</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#1f2024] mt-2">
            {stats.total_finishers || 0} Finisher
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">
            {stats.checked_in_count || 0} Check-in di Venue
          </span>
        </div>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links / Shortcuts */}
        <div className="bg-gradient-to-br from-[#290812] to-[#450e1e] text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] text-[#f2bb5a] tracking-wider uppercase block mb-1">
              PANITIA PINTAR
            </span>
            <h3 className="text-xl font-bold">Akses Cepat Hari-H</h3>
            <p className="text-xs text-[#f5dadc] mt-2 leading-relaxed">
              Buka kamera scanner untuk verifikasi pengambilan jersey/race pack atau catat waktu pelari yang melewati garis finish.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <Link
              href="/admin/scanner"
              className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-medium text-xs border border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[#f2bb5a]" />
                <span>Buka Scanner Kamera</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/timing"
              className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-medium text-xs border border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-[#f2bb5a]" />
                <span>Catat BIB Finish & Stopwatch</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Tabel Pesanan Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5ded7] shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-[#1f2024]">Pendaftaran & Transaksi Terbaru</h3>
            <Link href="/admin/payments" className="text-xs font-semibold text-[#a91024] hover:underline">
              Lihat Semua Transaksi →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0e6dd] text-[#8a7772] font-mono text-[10px] uppercase">
                  <th className="pb-3">Order / BIB</th>
                  <th className="pb-3">Peserta</th>
                  <th className="pb-3">Jersey</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ede4]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#8a7772]">
                      Belum ada transaksi terdaftar.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-[#fcfaf7]">
                      <td className="py-3 font-mono font-bold text-[#a91024]">
                        {o.bib_number ? `#${o.bib_number}` : o.id.slice(0, 14) + '...'}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold block text-[#1f2024]">{o.user_name}</span>
                        <small className="text-[#8a7772]">{o.user_email}</small>
                      </td>
                      <td className="py-3 font-mono font-medium">
                        Size {o.jersey_size || 'M'}
                      </td>
                      <td className="py-3 font-mono font-semibold">
                        Rp {formatIDR(Number(o.total_amount))}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                          o.status === 'settlement'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
