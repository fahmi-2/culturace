'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Camera, CheckCircle2, AlertTriangle, XCircle, Shirt, User, RefreshCw } from 'lucide-react'

export default function AdminScannerPage() {
  const [mode, setMode] = useState<'racepack' | 'checkin'>('racepack')
  const [scanResult, setScanResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationMsg, setConfirmationMsg] = useState('')

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  // Mulai Scanner Kamera
  const startScanner = async () => {
    setCameraError('')
    setScanResult(null)
    setConfirmationMsg('')

    try {
      const qrScanner = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = qrScanner

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleTokenScanned(decodedText)
          // Berhenti sementara setelah sukses scan
          stopScanner()
        },
        (errorMessage) => {
          // ignore scan frame misses
        }
      )
      setIsScanning(true)
    } catch (err: any) {
      console.error(err)
      setCameraError('Gagal mengakses kamera. Pastikan izin kamera aktif atau gunakan input manual.')
      setIsScanning(false)
    }
  }

  // Stop Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop()
      } catch (e) {
        console.error('Stop error', e)
      }
      setIsScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  // Handler saat token berhasil didapatkan
  const handleTokenScanned = async (token: string) => {
    if (!token) return
    setIsSubmitting(true)
    setConfirmationMsg('')

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), mode })
      })
      const data = await res.json()
      setScanResult(data)
    } catch (err) {
      setScanResult({ valid: false, error: 'Gagal memvalidasi QR ke server' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Konfirmasi Penyerahan Race Pack
  const confirmRacepack = async () => {
    if (!scanResult?.ticket?.ticket_id) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: scanResult.ticket.ticket_id,
          officerName: 'Panitia Meja Race Pack'
        })
      })
      const data = await res.json()
      if (res.ok) {
        setConfirmationMsg('✓ Race Pack Berhasil Diserahkan!')
        setScanResult((prev: any) => ({
          ...prev,
          ticket: { ...prev.ticket, racepack_taken: true, racepack_taken_at: new Date() },
          actionRequired: null
        }))
      } else {
        alert(data.error || 'Gagal update status')
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1f2024] tracking-tight">Scanner Panitia</h2>
          <p className="text-xs text-[#716f70] mt-1">
            Gunakan kamera HP atau laptop untuk scan kartu peserta secara instan.
          </p>
        </div>

        {/* Switch Mode Tabs */}
        <div className="flex p-1 bg-[#ebe4dd] rounded-2xl border border-[#d9c8bb] self-start sm:self-auto">
          <button
            onClick={() => {
              setMode('racepack')
              setScanResult(null)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'racepack'
                ? 'bg-[#a91024] text-white shadow-xs'
                : 'text-[#5e5351] hover:text-black'
            }`}
          >
            1. Pengambilan Race Pack
          </button>
          <button
            onClick={() => {
              setMode('checkin')
              setScanResult(null)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'checkin'
                ? 'bg-[#a91024] text-white shadow-xs'
                : 'text-[#5e5351] hover:text-black'
            }`}
          >
            2. Check-in Gate (Hari-H)
          </button>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Camera Box */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5ded7] shadow-xs flex flex-col items-center">
          <span className="font-mono text-[10px] text-[#a91024] uppercase font-bold tracking-wider mb-2">
            KAMERA VIEWPORT
          </span>

          <div
            id="qr-reader"
            className="w-full max-w-[320px] h-[300px] bg-[#1a1718] rounded-2xl overflow-hidden flex items-center justify-center relative border border-[#332b2d]"
          >
            {!isScanning && (
              <div className="text-center p-6 text-[#baa79d]">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Kamera dalam keadaan mati.</p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-3 text-rose-600 text-xs text-center font-medium">
              {cameraError}
            </div>
          )}

          <div className="flex gap-3 mt-4 w-full max-w-[320px]">
            {!isScanning ? (
              <button
                onClick={startScanner}
                className="flex-1 bg-[#a91024] hover:bg-[#8e1021] text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4" /> Buka Kamera
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Tutup Kamera
              </button>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="w-full max-w-[320px] mt-6 pt-4 border-t border-[#f0e6dd]">
            <label className="text-[11px] font-mono text-[#8a7772] block mb-1.5 uppercase font-medium">
              Input Manual (Nomor BIB / Token):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Misal: 5K-001"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTokenScanned(manualToken)}
                className="flex-1 bg-[#fcfaf7] border border-[#e5ded7] px-3 py-2 rounded-xl text-xs outline-none focus:border-[#a91024] font-mono uppercase"
              />
              <button
                onClick={() => handleTokenScanned(manualToken)}
                disabled={!manualToken.trim() || isSubmitting}
                className="bg-[#1f2024] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition disabled:opacity-50"
              >
                Cek
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5ded7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-[#f0e6dd] mb-4">
              <span className="font-bold text-sm text-[#1f2024]">Hasil Verifikasi Peserta</span>
              <span className="font-mono text-[10px] text-[#8a7772] uppercase font-bold">
                MODE: {mode === 'racepack' ? 'RACE PACK' : 'GATE CHECK-IN'}
              </span>
            </div>

            {isSubmitting ? (
              <div className="py-20 text-center text-[#8a7772]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#a91024]" />
                <p className="text-xs font-mono">Memeriksa database peserta...</p>
              </div>
            ) : !scanResult ? (
              <div className="py-20 text-center text-[#baa79d]">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Arahkan kamera ke QR Code peserta atau ketik nomor BIB secara manual.</p>
              </div>
            ) : scanResult.error ? (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-800">
                <XCircle className="w-10 h-10 mx-auto mb-2 text-rose-600" />
                <h4 className="font-bold text-sm">Validasi Gagal</h4>
                <p className="text-xs mt-1">{scanResult.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Warning jika sudah diambil / check-in */}
                {(scanResult.alreadyTaken || scanResult.alreadyCheckedIn) && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold">
                      {scanResult.message}
                    </div>
                  </div>
                )}

                {/* Notifikasi Sukses */}
                {confirmationMsg && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{confirmationMsg}</span>
                  </div>
                )}

                {/* Card Info Peserta */}
                <div className="bg-[#fffdfa] border border-[#d9c8bc] rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#8a7772] uppercase block">NOMOR BIB</span>
                      <span className="text-3xl font-black font-mono text-[#a91024]">{scanResult.ticket?.bib_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#8a7772] uppercase block">KATEGORI</span>
                      <span className="text-lg font-bold font-mono text-[#1f2024]">{scanResult.ticket?.category || '5K'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f0e6dd]">
                    <span className="text-[10px] font-mono text-[#8a7772] uppercase block">NAMA PESERTA</span>
                    <span className="text-base font-bold text-[#1f2024]">{scanResult.ticket?.user_name}</span>
                    <span className="text-xs text-[#716f70] block">{scanResult.ticket?.user_email}</span>
                  </div>

                  {/* Highlight Ukuran Jersey */}
                  <div className="bg-[#f5e8db] p-3 rounded-lg flex items-center justify-between border border-[#e4d2c2]">
                    <span className="text-xs font-bold text-[#5c3e21] flex items-center gap-1.5">
                      <Shirt className="w-4 h-4 text-[#a91024]" /> UKURAN JERSEY WAJIB AMBIL:
                    </span>
                    <span className="font-mono font-black text-xl text-[#a91024]">
                      SIZE {scanResult.ticket?.jersey_size || 'M'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button: Serahkan Racepack */}
          {scanResult?.actionRequired === 'confirm_racepack' && !confirmationMsg && (
            <div className="mt-4 pt-4 border-t border-[#f0e6dd]">
              <button
                onClick={confirmRacepack}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Serahkan Race Pack & Konfirmasi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
