'use client'

import { useEffect, useState } from 'react'
import { Search, Clock, CheckCircle2, AlertCircle, RefreshCw, DollarSign } from 'lucide-react'

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [now, setNow] = useState(Date.now())

  const fetchOrders = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)

    fetch(`/api/admin/payments?${params.toString()}`)
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(fetchOrders, 8000)
    return () => {
      clearInterval(timer)
      clearInterval(poll)
    }
  }, [search, statusFilter])

  const formatIDR = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0)

  // Format countdown batas pembayaran
  const getExpiryCountdown = (expiresAt: string, status: string) => {
    if (status === 'settlement') return <span className="text-emerald-700 font-bold">LUNAS</span>
    if (status === 'expire') return <span className="text-stone-400">EXPIRED</span>

    const diff = new Date(expiresAt).getTime() - now
    if (diff <= 0) {
      return <span className="text-rose-600 font-mono font-bold">Waktu Habis</span>
    }

    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return (
      <span className="font-mono font-bold text-amber-600">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1f2024] tracking-tight">Monitoring Transaksi & Pembayaran</h2>
          <p className="text-xs text-[#716f70] mt-1">
            Pantau status pembayaran Midtrans secara realtime beserta sisa waktu pelunasan (30 menit).
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto bg-white border border-[#d9c8bb] text-[#1f2024] text-xs font-semibold px-4 py-2 rounded-xl shadow-xs hover:bg-[#faf6f2] transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#a91024]" /> Refresh Status
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e5ded7] shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8a7772] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Order ID, Nama Pelanggan, atau Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#fcfaf7] border border-[#e5ded7] rounded-xl text-xs outline-none focus:border-[#a91024] transition font-sans"
          />
        </div>

        {/* Filter Status */}
        <div className="flex gap-2">
          {['all', 'pending', 'settlement', 'expire'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase font-mono transition ${
                statusFilter === st
                  ? 'bg-[#a91024] text-white font-bold shadow-xs'
                  : 'bg-[#fcfaf7] border border-[#e5ded7] text-[#716f70] hover:bg-[#f5ede4]'
              }`}
            >
              {st === 'all' ? 'SEMUA' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-2xl border border-[#e5ded7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#faf6f2] border-b border-[#e5ded7] text-[#8a7772] font-mono text-[10px] uppercase">
                <th className="py-3 px-4">Order ID / BIB</th>
                <th className="py-3 px-4">Nama Pendaftar</th>
                <th className="py-3 px-4">Total Tagihan</th>
                <th className="py-3 px-4">Waktu Pesan</th>
                <th className="py-3 px-4">Batas Bayar (Lifetime)</th>
                <th className="py-3 px-4 text-right">Status Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6dd]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8a7772]">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8a7772]">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.order_id} className="hover:bg-[#fffaf5] transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-[#1f2024] block">{o.order_id}</span>
                      {o.bib_number && (
                        <span className="text-[11px] font-bold text-[#a91024]">BIB: #{o.bib_number}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1f2024] block">{o.user_name}</span>
                      <small className="text-[#8a7772]">{o.user_email} · {o.user_phone}</small>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#1f2024]">
                      Rp {formatIDR(Number(o.total_amount))}
                    </td>

                    <td className="py-3.5 px-4 text-[#716f70] font-mono text-[11px]">
                      {new Date(o.created_at).toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#8a7772]" />
                        {getExpiryCountdown(o.expires_at, o.status)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase ${
                        o.status === 'settlement'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {o.status === 'settlement' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
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
  )
}
