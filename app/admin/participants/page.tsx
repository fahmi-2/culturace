'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, ExternalLink, Printer, CheckCircle2, Clock, XCircle, Shirt } from 'lucide-react'
import Link from 'next/link'

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [racepackFilter, setRacepackFilter] = useState('all')
  const [checkinFilter, setCheckinFilter] = useState('all')

  const fetchParticipants = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (racepackFilter !== 'all') params.set('racepack', racepackFilter)
    if (checkinFilter !== 'all') params.set('checkin', checkinFilter)

    fetch(`/api/admin/participants?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setParticipants(data.participants || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchParticipants()
  }, [search, racepackFilter, checkinFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1f2024] tracking-tight">Data Peserta & BIB Lari</h2>
          <p className="text-xs text-[#716f70] mt-1">
            Total {participants.length} peserta resmi terdaftar dalam kategori 5K Fun Run.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="self-start sm:self-auto bg-white border border-[#d9c8bb] text-[#1f2024] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:bg-[#faf6f2] transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Cetak Manifest Peserta
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e5ded7] shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8a7772] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nomor BIB, Nama Peserta, Email, atau No. WA..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#fcfaf7] border border-[#e5ded7] rounded-xl text-xs outline-none focus:border-[#a91024] transition font-sans"
          />
        </div>

        {/* Filter Race Pack */}
        <div className="flex gap-2">
          <select
            value={racepackFilter}
            onChange={e => setRacepackFilter(e.target.value)}
            className="bg-[#fcfaf7] border border-[#e5ded7] text-xs font-medium px-3 py-2 rounded-xl outline-none text-[#1f2024]"
          >
            <option value="all">Semua Race Pack</option>
            <option value="taken">Sudah Diambil</option>
            <option value="untaken">Belum Diambil</option>
          </select>

          {/* Filter Check-in */}
          <select
            value={checkinFilter}
            onChange={e => setCheckinFilter(e.target.value)}
            className="bg-[#fcfaf7] border border-[#e5ded7] text-xs font-medium px-3 py-2 rounded-xl outline-none text-[#1f2024]"
          >
            <option value="all">Semua Check-in Gate</option>
            <option value="checked">Sudah Check-in</option>
            <option value="unchecked">Belum Check-in</option>
          </select>
        </div>
      </div>

      {/* Tabel Peserta */}
      <div className="bg-white rounded-2xl border border-[#e5ded7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#faf6f2] border-b border-[#e5ded7] text-[#8a7772] font-mono text-[10px] uppercase">
                <th className="py-3 px-4">BIB</th>
                <th className="py-3 px-4">Nama Peserta</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Kategori / Jersey</th>
                <th className="py-3 px-4">Race Pack</th>
                <th className="py-3 px-4">Gate Check-in</th>
                <th className="py-3 px-4">Waktu Finish</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6dd]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8a7772]">
                    Memuat daftar peserta...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8a7772]">
                    Tidak ada data peserta yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                participants.map(p => (
                  <tr key={p.ticket_id} className="hover:bg-[#fffaf5] transition">
                    {/* BIB */}
                    <td className="py-3 px-4 font-mono font-black text-sm text-[#a91024]">
                      {p.bib_number}
                    </td>

                    {/* Nama */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#1f2024] block">{p.user_name}</span>
                      <small className="text-[#8a7772] font-mono">Order: #{p.order_id}</small>
                    </td>

                    {/* Kontak */}
                    <td className="py-3 px-4 text-[#4a4443]">
                      <div>{p.user_email}</div>
                      <div className="text-[11px] text-[#8a7772] font-mono">{p.user_phone || '-'}</div>
                    </td>

                    {/* Kategori & Jersey */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#1f2024]">{p.category || '5K'}</span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8a7772] font-mono">
                        <Shirt className="w-3 h-3 text-[#a91024]" /> Size {p.jersey_size || 'M'}
                      </div>
                    </td>

                    {/* Status Race Pack */}
                    <td className="py-3 px-4">
                      {p.racepack_taken ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Diambil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" /> Belum
                        </span>
                      )}
                    </td>

                    {/* Check-in Gate */}
                    <td className="py-3 px-4">
                      {p.is_used ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full text-[10px]">
                          -
                        </span>
                      )}
                    </td>

                    {/* Finish Time */}
                    <td className="py-3 px-4 font-mono font-bold">
                      {p.finish_time ? (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {p.finish_time}
                        </span>
                      ) : (
                        <span className="text-[#a59891]">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/ticket/${p.qr_code_token}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 bg-white border border-[#d9c8bb] hover:border-[#a91024] hover:text-[#a91024] text-[#1f2024] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                      >
                        <span>E-Ticket</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
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
