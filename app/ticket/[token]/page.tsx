'use client'

import { useEffect, useState, use } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, AlertCircle, Clock, Calendar, MapPin, Shirt, Award, Share2, Download } from 'lucide-react'
import Link from 'next/link'

export default function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/ticket/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.ticket) {
          setTicket(data.ticket)
          // Jika dibuka dengan parameter ?print=true, otomatis buka dialog print/PDF browser
          if (typeof window !== 'undefined' && window.location.search.includes('print=true')) {
            setTimeout(() => {
              window.print();
            }, 600);
          }
        } else {
          setError(data.error || 'Tiket tidak ditemukan')
        }
      })
      .catch(err => {
        setError('Gagal memuat informasi tiket')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#210810] text-[#f7e6e8] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 border-4 border-[#a91024] border-t-[#f3ba61] rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm tracking-widest text-[#f3ba61]">MEMUAT KARTU PESERTA...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#fffaf3] text-[#1f2024] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-[#eadfd6] text-center">
          <AlertCircle className="w-16 h-16 text-[#c71932] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tiket Tidak Valid</h2>
          <p className="text-[#716f70] text-sm mb-6">{error || 'Kode QR atau tautan tiket tidak ditemukan dalam sistem.'}</p>
          <Link href="/" className="inline-block bg-[#a91024] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#8e1021] transition">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-page-wrapper min-h-screen bg-[#f5f0eb] py-6 sm:py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
      {/* Container Kartu Peserta Resmi */}
      <div className="ticket-card w-full max-w-[520px] bg-white rounded-3xl shadow-xl overflow-hidden border border-[#e4d7cc]">
        
        {/* Header E-Ticket */}
        <div className="ticket-header bg-gradient-to-r from-[#3a0a18] via-[#8e1025] to-[#a91024] p-5 sm:p-6 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-[#f3ba61] text-[#3a0a18] font-mono font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-full mb-1.5">
                OFFICIAL RACE PASS
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">CULTURACE 2026</h1>
              <p className="text-[11px] text-[#f7dfe0] mt-0.5">Masjid Moekhlas Sidik Race Edition · Pandaan</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#f3ba61] block">KATEGORI</span>
              <span className="text-xl sm:text-2xl font-black font-mono">{ticket.category || '5K'}</span>
            </div>
          </div>
        </div>

        {/* BIB Hero Display */}
        <div className="ticket-hero bg-[#fffdfa] border-b border-dashed border-[#d9c8bc] px-5 py-5 text-center relative">
          <span className="text-[10px] font-mono tracking-widest text-[#8a7772] uppercase block mb-0.5">
            NOMOR BIB RESMI
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#a91024] my-1">
            {ticket.bib_number}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1f2024] mt-1.5 uppercase tracking-wide">
            {ticket.user_name}
          </h2>
          <span className="text-[11px] font-mono text-[#8a7772]">ORDER ID: #{ticket.order_id}</span>
        </div>

        {/* Status Badges & Info Detail */}
        <div className="ticket-body p-5 sm:p-6 space-y-4">
          {/* Status Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#fcfaf7] border border-[#eee5dc] p-2.5 sm:p-3 rounded-xl">
              <span className="text-[9px] font-mono text-[#8a7772] block uppercase mb-0.5">STATUS PEMBAYARAN</span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>LUNAS (SETTLED)</span>
              </div>
            </div>

            <div className={`border p-2.5 sm:p-3 rounded-xl ${ticket.racepack_taken ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-[9px] font-mono text-[#8a7772] block uppercase mb-0.5">STATUS RACE PACK</span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {ticket.racepack_taken ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800">SUDAH DIAMBIL</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-amber-800">BELUM DIAMBIL</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="ticket-qr bg-[#faf6f2] border-2 border-[#eadfd6] rounded-xl p-3.5 sm:p-4 flex flex-col items-center text-center">
            <span className="text-[9px] font-mono text-[#8a7772] tracking-wider uppercase mb-2">
              SCAN KODE QR DI LOKASI RACE PACK & GATE
            </span>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-[#e2d6ca]">
              <QRCodeSVG
                value={ticket.qr_code_token}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="font-mono text-[10px] text-[#8a7772] mt-2 select-all bg-white px-2.5 py-0.5 rounded border border-[#e2d6ca]">
              {ticket.qr_code_token}
            </span>
          </div>

          {/* Participant & Event Spec */}
          <div className="ticket-meta space-y-2 pt-1 text-xs text-[#4a4443]">
            <div className="flex justify-between items-center py-1.5 border-b border-[#f0e6dd]">
              <span className="text-[#8a7772] flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5 text-[#a91024]" /> Ukuran Jersey
              </span>
              <span className="font-bold text-[#1f2024] font-mono text-sm">Size {ticket.jersey_size || 'M'}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-[#f0e6dd]">
              <span className="text-[#8a7772] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#a91024]" /> Jadwal Race
              </span>
              <span className="font-semibold text-[#1f2024]">Minggu, 29 Nov 2026 · 05:30 WIB</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-[#f0e6dd]">
              <span className="text-[#8a7772] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#a91024]" /> Lokasi Start / Finish
              </span>
              <span className="font-semibold text-[#1f2024] text-right">Masjid Moekhlas Sidik Pandaan</span>
            </div>
          </div>
        </div>

        {/* Footer Card */}
        <div className="ticket-footer bg-[#1f1b19] px-5 py-3 text-center text-[#baa79d] text-[10px]">
          Tunjukkan QR Code ini pada panitia untuk mengambil race pack atau check-in gerbang start.
        </div>
      </div>

      {/* Button Action */}
      <div className="mt-5 flex gap-4 text-xs font-semibold print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-white border border-[#d9c8bb] text-[#1f2024] px-5 py-2.5 rounded-xl shadow-sm hover:bg-[#faf6f2] transition flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Cetak / Unduh PDF
        </button>
        <Link
          href="/"
          className="bg-[#a91024] text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-[#8e1021] transition flex items-center gap-2"
        >
          Kembali ke Web Culturace
        </Link>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ticket-page-wrapper {
            background: transparent !important;
            padding: 0 !important;
            min-height: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .ticket-card {
            box-shadow: none !important;
            border: 1.5px solid #d4c4b6 !important;
            max-width: 500px !important;
            width: 100% !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
