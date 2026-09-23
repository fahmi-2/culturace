'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Timer, Trophy, CheckCircle2, AlertCircle, RefreshCw, Flag, Sparkles } from 'lucide-react'

export default function AdminTimingPage() {
  const [wave, setWave] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bibInput, setBibInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState('00:00:00')

  const bibInputRef = useRef<HTMLInputElement>(null)

  // Format Elapsed Stopwatch dari Gun Start Time
  const updateStopwatch = () => {
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
    } else {
      setElapsed('00:00:00')
    }
  }

  const loadTimingData = () => {
    fetch('/api/admin/timing?category=5K')
      .then(res => res.json())
      .then(data => {
        setWave(data.wave)
        setLeaderboard(data.leaderboard || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTimingData()
    const timerInterval = setInterval(updateStopwatch, 1000)
    const pollInterval = setInterval(loadTimingData, 4000)
    return () => {
      clearInterval(timerInterval)
      clearInterval(pollInterval)
    }
  }, [wave?.gun_start_time, wave?.is_started])

  // Trigger Gun Start
  const handleGunStart = async () => {
    if (!confirm('Apakah Anda yakin ingin memulai Gun Start untuk kategori 5K Fun Run? Waktu stopwatch akan langsung berjalan.')) {
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/timing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gun_start', category: '5K' })
      })
      const data = await res.json()
      if (res.ok) {
        setWave(data.wave)
        setMessage('🏁 GUN START 5K BERHASIL DIMULAI!')
        if (bibInputRef.current) bibInputRef.current.focus()
      } else {
        setError(data.error || 'Gagal memulai race')
      }
    } catch (err: any) {
      setError('Kesalahan koneksi ke server')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Finish Logging saat BIB diketik
  const handleRecordFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bibInput.trim()) return

    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/timing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_finish',
          category: '5K',
          bibNumber: bibInput.trim()
        })
      })
      const data = await res.json()

      if (res.ok) {
        setMessage(`✓ Berhasil: ${data.message}`)
        setBibInput('')
        loadTimingData()
      } else {
        setError(data.error || 'Gagal mencatat finish')
      }
    } catch (err: any) {
      setError('Kesalahan server saat mencatat waktu')
    } finally {
      setIsSubmitting(false)
      if (bibInputRef.current) bibInputRef.current.focus()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1f2024] tracking-tight">Race Timing & Finish Recording</h2>
          <p className="text-xs text-[#716f70] mt-1">
            Modul resmi Gun Start, stopwatch pertandingan, dan pencatatan BIB finish pelari 5K.
          </p>
        </div>

        <button
          onClick={loadTimingData}
          className="self-start sm:self-auto bg-white border border-[#d9c8bb] text-[#1f2024] text-xs font-semibold px-4 py-2 rounded-xl shadow-xs hover:bg-[#faf6f2] transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#a91024]" /> Refresh Leaderboard
        </button>
      </div>

      {/* Gun Start Hero Banner & Timer */}
      <div className="bg-gradient-to-r from-[#210810] via-[#5a1221] to-[#8a1024] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-[#a91024]/40">
        <div className="text-center lg:text-left">
          <span className="inline-block bg-[#f3ba61] text-[#210810] font-mono font-bold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase mb-2">
            SESI KATEGORI: 5K FUN RUN
          </span>
          <h3 className="text-2xl sm:text-3xl font-black">Stopwatch Resmi Pertandingan</h3>
          <p className="text-xs text-[#f5dadc] mt-1 max-w-md">
            Waktu dihitung otomatis sejak tembakan Gun Start pertama kali ditekan oleh marshal timing.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#f3ba61]">
            Status: {wave?.is_started ? `● SEDANG BERLANGSUNG (${new Date(wave.gun_start_time).toLocaleTimeString('id-ID')})` : 'MENUNGGU MULAI'}
          </div>
        </div>

        {/* Stopwatch Display */}
        <div className="flex flex-col items-center">
          <div className="bg-[#120408] px-8 py-4 rounded-2xl border-2 border-[#f3ba61]/50 shadow-inner">
            <span className="font-mono text-5xl sm:text-6xl font-black tracking-widest text-[#f3ba61]">
              {elapsed}
            </span>
          </div>

          <div className="mt-4">
            {!wave?.is_started ? (
              <button
                onClick={handleGunStart}
                disabled={isSubmitting}
                className="bg-[#f3ba61] hover:bg-[#e0a84d] text-[#210810] font-black text-sm px-6 py-3.5 rounded-xl shadow-lg transition flex items-center gap-2 font-mono uppercase tracking-wide"
              >
                <Flag className="w-5 h-5 fill-current" /> Mulai Balapan (Gun Start)
              </button>
            ) : (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-full border border-emerald-500/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                RACE 5K IS LIVE & RUNNING
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick BIB Logger & Feedbacks */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5ded7] shadow-xs">
        <h3 className="text-sm font-bold text-[#1f2024] uppercase tracking-wide font-mono mb-2">
          Pencatatan Waktu Finish Cepat (Quick BIB Logger)
        </h3>
        <p className="text-xs text-[#716f70] mb-4">
          Ketik nomor BIB pelari yang melintasi garis finish (contoh: <code className="font-mono font-bold text-[#a91024]">5K-001</code>), lalu tekan <strong>Enter</strong>.
        </p>

        <form onSubmit={handleRecordFinish} className="flex flex-col sm:flex-row gap-3">
          <input
            ref={bibInputRef}
            type="text"
            placeholder="Ketik Nomor BIB (misal: 5K-001) lalu Enter..."
            value={bibInput}
            onChange={e => setBibInput(e.target.value.toUpperCase())}
            disabled={!wave?.is_started || isSubmitting}
            className="flex-1 bg-[#fcfaf7] border-2 border-[#e5ded7] focus:border-[#a91024] px-4 py-3 rounded-xl text-base font-mono font-bold tracking-wider uppercase outline-none transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!wave?.is_started || !bibInput.trim() || isSubmitting}
            className="bg-[#a91024] hover:bg-[#8e1021] text-white font-bold px-8 py-3.5 rounded-xl text-xs uppercase font-mono tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            <Timer className="w-4 h-4" /> Catat Waktu Finish
          </button>
        </form>

        {/* Feedback Messages */}
        {message && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Live Finish Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-[#e5ded7] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#e5ded7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#f3ba61]" />
            <h3 className="font-bold text-sm text-[#1f2024]">Live Leaderboard Pelari Finish (Kategori 5K)</h3>
          </div>
          <span className="font-mono text-xs text-[#8a7772]">
            Total {leaderboard.length} Pelari Selesai
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#faf6f2] border-b border-[#e5ded7] text-[#8a7772] font-mono text-[10px] uppercase">
                <th className="py-3 px-4 text-center w-16">Peringkat</th>
                <th className="py-3 px-4">BIB</th>
                <th className="py-3 px-4">Nama Pelari</th>
                <th className="py-3 px-4">Gender / Jersey</th>
                <th className="py-3 px-4">Waktu Finish Jam</th>
                <th className="py-3 px-4 text-right">Durasi Tempuh (Net Time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6dd]">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8a7772]">
                    Belum ada pelari yang tercatat finish.
                  </td>
                </tr>
              ) : (
                leaderboard.map((runner, index) => {
                  const rank = index + 1
                  return (
                    <tr key={runner.timing_id || runner.id} className="hover:bg-[#fffaf5] transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-black text-xs ${
                          rank === 1
                            ? 'bg-[#f3ba61] text-[#210810] shadow-sm'
                            : rank === 2
                            ? 'bg-stone-300 text-stone-900'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-[#8a7772]'
                        }`}>
                          {rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-sm text-[#a91024]">
                        {runner.bib_number}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-sm text-[#1f2024]">
                        {runner.runner_name}
                      </td>

                      <td className="py-3.5 px-4 text-[#716f70] font-mono">
                        {runner.gender || 'General'} · Size {runner.jersey_size || 'M'}
                      </td>

                      <td className="py-3.5 px-4 text-[#716f70] font-mono text-[11px]">
                        {new Date(runner.finish_time).toLocaleTimeString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-base text-[#a91024] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                          {runner.formatted_duration}
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
    </div>
  )
}
