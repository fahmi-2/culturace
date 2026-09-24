'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Copy, Crosshair, Download, Droplets, ExternalLink, Flag, Gem, MapPin, Menu, QrCode, Search, ShieldCheck, Sparkles, Trophy, X, Zap } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => <div style={{ height: '420px', display: 'grid', placeItems: 'center', background: '#fffaf1', border: '1px solid #e2d6ca', color: '#8a7772', fontFamily: 'monospace' }}>Memuat Peta Interaktif & Elevasi...</div>
})

const formatIDR = (n: number) => new Intl.NumberFormat('id-ID').format(n)

export default function Home() {
  const [modal, setModal] = useState<'register' | 'payment' | 'pass' | 'scanner' | null>(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Laki-laki'
  })
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [size, setSize] = useState('M')
  const [bib, setBib] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [completedOrder, setCompletedOrder] = useState<any>(null)
  const [ticketData, setTicketData] = useState<any>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleOrderConfirmation = async (orderId: string) => {
    setIsConfirming(true)
    setModal('pass')

    // Polling retry hingga tiket berhasil digenerate di database
    let attempts = 0
    const maxAttempts = 6

    const checkConfirm = async () => {
      try {
        const res = await fetch('/api/orders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })
        const data = await res.json()
        if (data.ticket) {
          setTicketData(data.ticket)
          setIsConfirming(false)
          return
        }
      } catch (err) {
        console.error('Failed to confirm ticket:', err)
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkConfirm, 2000)
      } else {
        setIsConfirming(false)
      }
    }

    checkConfirm()
  }

  // Real dataset pelari dari database
  const [liveRunners, setLiveRunners] = useState<any[]>([])
  const [liveLoading, setLiveLoading] = useState(true)

  const fetchLiveRaceData = () => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.runners) {
          setLiveRunners(data.runners)
        }
      })
      .catch(err => console.error('Failed to load race dataset:', err))
      .finally(() => setLiveLoading(false))
  }

  useEffect(() => {
    fetchLiveRaceData()
    const interval = setInterval(fetchLiveRaceData, 10000)
    return () => clearInterval(interval)
  }, [])

  // Logika Penetapan Harga Dinamis:
  // Saat ini Early Bird aktif (Rp 150.000). Jika memasuki periode 1 November 2026 s/d 20 November 2026 (atau setelah 1 Nov), harga otomatis Rp 175.000
  const isRegularPricePeriod = useMemo(() => {
    const now = new Date()
    // Contoh: Mulai 1 November 2026 pukul 00:00:00
    const regularStartDate = new Date('2026-11-01T00:00:00+07:00')
    return now >= regularStartDate
  }, [])

  const categories = useMemo(() => [
    {
      id: '5K',
      title: '5K Fun Run',
      subtitle: isRegularPricePeriod ? 'Lari Santai · Tarif Reguler' : 'Lari Santai · Early bird',
      price: isRegularPricePeriod ? 175000 : 150000,
      regularPrice: 175000,
      isEarlyBird: !isRegularPricePeriod,
      tone: 'light',
      popular: true
    },
  ], [isRegularPricePeriod])

  const [selected, setSelected] = useState(categories[0])
  const [scanned, setScanned] = useState(false)
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  // Filter pelari dari dataset asli berdasarkan query pencarian nama atau BIB
  const visibleRunners = useMemo(() => {
    return liveRunners.filter(r =>
      (r.runner_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (r.bib_number || '').toLowerCase().includes(query.toLowerCase())
    )
  }, [liveRunners, query])

  const openRegister = (cat = selected) => { setSelected(cat); setStep(1); setModal('register'); setMobileNav(false) }
  const goPayment = () => setModal('payment')

  const targetDate = useMemo(() => new Date('2026-11-29T05:30:00+07:00').getTime(), [])
  const [timeLeft, setTimeLeft] = useState({ days: '072', hours: '14', minutes: '32', seconds: '45' })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const diff = targetDate - now
      if (diff <= 0) {
        setTimeLeft({ days: '000', hours: '00', minutes: '00', seconds: '00' })
        return
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24))
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({
        days: String(d).padStart(3, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      })
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return <main className="site-shell">
    <nav className="navbar">
      <a href="#top" className="brand brand-header" aria-label="CULTURACE - Masjid Merah Moekhlas Sidik Race Edition">
        <img
          src="/logobawah-transparent.png"
          alt="CULTURACE Logo"
          className="brand-logo-img"
        />
        <div className="brand-badge-box">
          <span className="brand-edition-capsule">
            <span className="brand-edition-dot" />
            Masjid Merah Moekhlas Sidik RACE EDITION
          </span>
        </div>
      </a>
      <div className="navlinks">
        <a href="#categories">Categories</a>
        <a href="#route">Route & Elevation</a>
        <a href="/leaderboard">Live Leaderboard</a>
        <a href="/admin" style={{ color: 'var(--ruby)', fontWeight: 700 }}>Dashboard Panitia</a>
      </div>
      <button
        type="button"
        className="menu-button"
        aria-label="Buka Menu"
        onClick={() => setMobileNav(true)}
      >
        <Menu size={24} />
      </button>
      <button className="btn btn-primary nav-cta" onClick={() => openRegister()}>
        Daftar Sekarang <ArrowRight size={16} />
      </button>
    </nav>

    {/* Mobile Sidebar Pop Up Drawer */}
    {mobileNav && (
      <div className="mobile-drawer-overlay" onClick={() => setMobileNav(false)}>
        <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div className="brand brand-drawer">
              <img
                src="/culturace-ruby.png"
                alt="CULTURACE Logo"
                className="brand-logo-img brand-logo-drawer"
              />
              <div className="brand-badge-box">
                <span className="brand-edition-capsule">
                  <span className="brand-edition-dot" />
                  Masjid Merah Moekhlas Sidik RACE EDITION
                </span>
              </div>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              aria-label="Tutup Menu"
              onClick={() => setMobileNav(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="drawer-links">
            <a href="#categories" onClick={() => setMobileNav(false)}>Categories</a>
            <a href="#route" onClick={() => setMobileNav(false)}>Route & Elevation</a>
            <a href="#leaderboard" onClick={() => setMobileNav(false)}>Live Leaderboard</a>
            <a href="#pass" onClick={() => setMobileNav(false)}>Race Pass</a>
          </div>

          <div className="drawer-footer">
            <button className="btn btn-primary full" onClick={() => openRegister()}>
              Daftar Sekarang <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    )}

    <section className="hero" id="top">
      {/* Video Background Berlari */}
      <video
        className="hero-video-bg"
        src="/video running.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="hero-video-overlay" />
      <div className="hero-content">
        <div className="eyebrow"><span /> PANDAAN — PASURUAN CULTURAL HERITAGE RUN</div>
        <h1>Lari melintasi<br /><em>keagungan budaya</em><br />dan landmark merah.</h1>
        <p>Rasakan energi Pasuruan dalam satu langkah. Menyusuri jejak heritage, sawah hijau, dan arsitektur Masjid Merah Moekhlas Sidik yang ikonik.</p>
        <div className="hero-actions">
          <button className="btn btn-gold" onClick={() => openRegister()}>Daftar Sekarang <ArrowRight size={17} /></button>
          <a className="text-link" href="#route">Jelajahi rute <ChevronRight size={17} /></a>
        </div>
        <div className="stats">
          <div><strong>1,500+<span>+</span></strong><small>RUNNERS</small></div>
          <div><strong>1</strong><small>KATEGORI</small></div>
          <div><strong>Rp 20<span>jt</span></strong><small>PRIZE POOL</small></div>
        </div>
      </div>
    </section>
    {/* Advance Calendar Style Countdown Section */}
    <div className="countdown-wrapper">
      <div className="countdown-card">
        {/* Left: Mini Tear-off Calendar Badge */}
        <div className="cal-badge-section">
          <div className="cal-sheet">
            <div className="cal-rings">
              <span className="cal-ring" />
              <span className="cal-ring" />
              <span className="cal-ring" />
            </div>
            <div className="cal-header">NOV 2026</div>
            <div className="cal-body">
              <span className="cal-date">29</span>
              <span className="cal-day">MINGGU</span>
            </div>
          </div>
          <div className="cal-info">
            <div className="cal-tag">
              <span className="cal-dot" /> OFFICIAL RACE DAY
            </div>
            <h3 className="cal-title">29 November 2026</h3>
            <p className="cal-sub">
              <Clock3 size={13} /> 05:30 WIB · Pandaan, Pasuruan
            </p>
          </div>
        </div>

        {/* Center: Flip-Calendar Style Countdown Tiles */}
        <div className="cal-timer-group">
          <div className="cal-tile">
            <div className="cal-tile-top-bar" />
            <div className="cal-tile-face">
              <div className="cal-tile-seam" />
              <span className="cal-tile-num">{timeLeft.days}</span>
            </div>
            <span className="cal-tile-label">HARI</span>
          </div>

          <div className="cal-sep">:</div>

          <div className="cal-tile">
            <div className="cal-tile-top-bar" />
            <div className="cal-tile-face">
              <div className="cal-tile-seam" />
              <span className="cal-tile-num">{timeLeft.hours}</span>
            </div>
            <span className="cal-tile-label">JAM</span>
          </div>

          <div className="cal-sep">:</div>

          <div className="cal-tile">
            <div className="cal-tile-top-bar" />
            <div className="cal-tile-face">
              <div className="cal-tile-seam" />
              <span className="cal-tile-num">{timeLeft.minutes}</span>
            </div>
            <span className="cal-tile-label">MENIT</span>
          </div>

          <div className="cal-sep">:</div>

          <div className="cal-tile cal-tile-active">
            <div className="cal-tile-top-bar" />
            <div className="cal-tile-face">
              <div className="cal-tile-seam" />
              <span className="cal-tile-num">{timeLeft.seconds}</span>
            </div>
            <span className="cal-tile-label">DETIK</span>
          </div>
        </div>

        {/* Right: Quick Action & Note */}
        <div className="cal-action-section">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=CULTURACE+2026+-+Pasuruan+Cultural+Heritage+Run&dates=20261129T053000/20261129T103000&details=Lomba+lari+heritage+budaya+Masjid+Merah+Pandaan+Pasuruan&location=Masjid+Merah+Pandaan,+Pasuruan"
            target="_blank"
            rel="noreferrer"
            className="cal-btn-add"
            title="Simpan ke Google Calendar"
          >
            <CalendarDays size={15} />
            <span>Simpan Jadwal</span>
          </a>
          <small className="cal-note">START YOUR STORY</small>
        </div>
      </div>
    </div>
    <section className="section categories-section" id="categories"><div className="section-heading"><div><span className="kicker">ONE RACE ONE STORY</span></div><p>Satu lintasan, satu rasa yang mendalam. Langkah boleh sederhana, namun ceritanya mengakar selamanya.</p></div><div className="category-grid">{categories.map(cat => <article className={`category-card ${cat.tone}`} key={cat.id}>{cat.popular && <span className="popular">MOST POPULAR</span>}<div className="category-top"><span className="distance">{cat.id}</span><span className="category-icon"><Zap size={18} /></span></div><h3>{cat.title}</h3><p>{cat.subtitle}</p><strong className="price">Rp {formatIDR(cat.price)} <del>Rp {formatIDR(cat.regularPrice)}</del></strong><small className="early-bird">EARLY BIRD · HEMAT Rp {formatIDR(cat.regularPrice - cat.price)}</small><ul>{['Jersey Dry-Fit Batik Pasuruan', 'Finisher medal logam emas', 'BIB number + timing chip', 'Refreshments sepanjang rute', 'Asuransi perlombaan'].map(item => <li key={item}><Check size={15} />{item}</li>)}</ul><button className="btn btn-outline" onClick={() => openRegister(cat)}>Pilih Kategori <ArrowRight size={15} /></button></article>)}</div></section>
    <section className="section route-section" id="route">
      <div className="section-heading">
        <div>
          <span className="kicker">THE RED LOOP</span>
          <h2>Rute yang<br /><em>punya cerita.</em></h2>
        </div>
        <p>Dari pelataran Masjid Merah Moekhlas Sidik, melewati warisan budaya dan kontur alam Pandaan. Setiap kilometer adalah bab baru.</p>
        <small className="route-address">
          <MapPin size={14} /> Jalan Sukorame, Durensewu, Pandaan, Pasuruan 67156 ·
          <a href="https://www.google.com/maps/dir/?api=1&destination=-7.6712,112.6983" target="_blank" rel="noreferrer">
            Navigasi Google Maps Asli
          </a>
        </small>
      </div>
      <RaceMap />
    </section>
    <section className="section leaderboard-section" id="leaderboard">
      <div className="leader-top">
        <div>
          <span className="kicker">LIVE RACE DATA · 5K FUN RUN</span>
          <h2>Siapa yang<br /><em>memimpin?</em></h2>
        </div>
        <div className="live-badge">
          <span /> LIVE DATABASE <small>Kategori 5K Saja</small>
        </div>
      </div>
      <div className="leader-tools">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Cari nama atau BIB (misal: 5K-001)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button className="active">Kategori 5K Fun Run</button>
        </div>
      </div>
      <div className="leader-table">
        <div className="table-head">
          <span>RANK</span>
          <span>RUNNER</span>
          <span>LAST CHECKPOINT</span>
          <span>SPLIT TIME</span>
          <span>NET TIME</span>
        </div>
        {visibleRunners.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a7772', fontStyle: 'italic' }}>
            {liveLoading ? 'Memuat data pelari dari database...' : 'Belum ada data peserta yang terdaftar atau cocok dengan pencarian.'}
          </div>
        ) : (
          visibleRunners.map((r, i) => {
            const rank = String(i + 1).padStart(2, '0');
            const initials = (r.runner_name || 'Runner')
              .split(' ')
              .map((x: string) => x[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div className="table-row" key={r.ticket_id || r.bib_number || i}>
                <strong className={i < 3 ? `medal medal-${i + 1}` : ''}>{rank}</strong>
                <div className="runner">
                  <span>{initials}</span>
                  <b>{r.runner_name}</b>
                  <small>BIB #{r.bib_number}</small>
                </div>
                <span>{r.last_checkpoint || 'Masjid Merah Moekhlas Sidik'}</span>
                <span>{r.split_time || '--:--:--'}</span>
                <strong>{r.net_time || (r.is_finished ? r.formatted_duration : 'On Track')}</strong>
              </div>
            );
          })
        )}
      </div>
    </section>
    <footer>
      <div className="brand brand-footer">
        <img
          src="/logobawah-white.png"
          alt="CULTURACE Logo"
          className="brand-logo-img brand-logo-footer"
        />
        <div className="brand-badge-box">
          <span className="brand-edition-capsule brand-capsule-footer">
            <span className="brand-edition-dot brand-dot-gold" />
            Masjid Merah Moekhlas Sidik RACE EDITION
          </span>
        </div>
      </div>
      <span>RUN WITH CULTURE · RUN WITH PURPOSE</span>
      <span>© 2026 CULTURACE</span>
    </footer>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className={`modal ${modal === 'scanner' ? 'scanner-modal' : ''}`} onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>{modal === 'register' && <><div className="modal-kicker">CULTURACE REGISTRATION</div><h2>Mulai langkahmu.</h2><div className="stepper">{['Data diri', 'Perlengkapan', 'Review'].map((s, i) => <div className={step >= i + 1 ? 'done' : ''} key={s}><span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>{s}</div>)}</div>
      {errorMessage && <div style={{ background: '#fce8e6', color: '#c5221f', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>{errorMessage}</div>}
      {step === 1 && (
        <div className="form-grid">
          <label>
            Nama lengkap *
            <input
              placeholder="Nama sesuai identitas"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>

          <label>
            Email aktif (Menerima E-Ticket & Nota) *
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value });
                  setEmailStatus('idle');
                }}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '8px 12px', fontSize: '12px', height: '42px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (re.test(formData.email.trim())) {
                    setEmailStatus('valid');
                    setErrorMessage('');
                  } else {
                    setEmailStatus('invalid');
                    setErrorMessage('Format email tidak valid. Pastikan penulisan email benar (misal: nama@gmail.com)');
                  }
                }}
              >
                Cek Email
              </button>
            </div>
            {emailStatus === 'valid' && (
              <span style={{ color: '#2e7d32', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                ✓ Format email valid & siap menerima tiket
              </span>
            )}
            {emailStatus === 'invalid' && (
              <span style={{ color: '#c5221f', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                ✕ Alamat email tidak valid
              </span>
            )}
          </label>

          <label>
            No. WhatsApp (Menerima Bukti Invoice) *
            <input
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </label>

          <label>
            Jenis Kelamin *
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
              style={{ width: '100%', height: '42px', borderRadius: '6px', border: '1px solid #dcd1c6', padding: '0 12px', background: '#fff' }}
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </label>

          <div className="selected-category">
            <small>KATEGORI PILIHAN</small>
            <b>{selected.title}</b>
            <span>Rp {formatIDR(selected.price)}</span>
          </div>
        </div>
      )}
      {step === 2 && <div className="gear-step"><div className="jersey-preview"><div className="jersey">C<span>RACE<br />WITH<br />CULTURE</span></div><div className="jersey-toggle">FRONT / BACK</div></div><div><label>BIB NAME<input value={bib} onChange={e => setBib(e.target.value.toUpperCase().slice(0, 12))} /></label><div className="bib-preview"><small>LIVE BIB PREVIEW</small><b>{bib || 'YOUR NAME'}</b><span>#{selected.id === '10K' ? '0223' : '0108'}</span></div><label className="size-label">UKURAN JERSEY</label><div className="sizes">{['S', 'M', 'L', 'XL', 'XXL'].map(s => <button className={size === s ? 'active' : ''} key={s} onClick={() => setSize(s)}>{s}</button>)}</div></div></div>}
      {step === 3 && <div className="review"><div><span>RUNNER</span><b>{bib || formData.name || 'PESERTA CULTURACE'}</b></div><div><span>KATEGORI</span><b>{selected.title}</b></div><div><span>EMAIL & WA</span><b>{formData.email}<br /><small>{formData.phone}</small></b></div><div><span>TOTAL BIAYA</span><b>Rp {formatIDR(selected.price + Math.round(selected.price * 0.02) + 5000)}</b></div><p><ShieldCheck size={17} /> Data aman dan terhubung langsung ke Midtrans Snap Payment Gateway.</p></div>}
      <div className="modal-actions"><button className="btn btn-ghost" onClick={() => step > 1 ? setStep(step - 1) : setModal(null)}>{step > 1 ? 'Kembali' : 'Batal'}</button><button className="btn btn-primary" disabled={isSubmitting} onClick={async () => {
        if (step === 1) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
            setErrorMessage('Mohon lengkapi Nama, Email aktif, dan No WhatsApp.');
            return;
          }
          if (!emailRegex.test(formData.email.trim())) {
            setErrorMessage('Format alamat email tidak valid. Mohon periksa kembali penulisan email Anda.');
            return;
          }
          setErrorMessage('');
          setStep(2);
        } else if (step === 2) {
          setStep(3);
        } else {
          // Step 3: Trigger Midtrans Snap
          setIsSubmitting(true);
          setErrorMessage('');
          try {
            const donationAmount = Math.round(selected.price * 0.02);
            const adminFee = 5000;
            const total = selected.price + donationAmount + adminFee;

            const response = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender,
                categoryTitle: selected.title,
                categoryPrice: selected.price,
                donation: donationAmount,
                adminFee,
                totalAmount: total,
                jerseySize: size,
                bibName: bib || formData.name
              })
            });

            const data = await response.json();
            if (!response.ok || !data.token) {
              throw new Error(data.error || 'Gagal memproses tiket pembayaran');
            }

            setCompletedOrder({
              orderId: data.orderId,
              name: formData.name,
              bib: bib || formData.name,
              size,
              category: selected.title
            });

            // Panggil Midtrans Snap Popup Resmi
            if (typeof window !== 'undefined' && (window as any).snap) {
              (window as any).snap.pay(data.token, {
                onSuccess: function (result: any) {
                  console.log('Payment success:', result);
                  handleOrderConfirmation(data.orderId);
                },
                onPending: function (result: any) {
                  console.log('Payment pending:', result);
                  handleOrderConfirmation(data.orderId);
                },
                onError: function (result: any) {
                  console.error('Payment error:', result);
                  alert('Pembayaran gagal atau dibatalkan.');
                },
                onClose: function () {
                  console.log('Snap popup closed by customer');
                }
              });
            } else if (data.redirectUrl) {
              window.location.href = data.redirectUrl;
            }
          } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Terjadi kendala saat menghubungi gateway Midtrans');
          } finally {
            setIsSubmitting(false);
          }
        }
      }}>{isSubmitting ? 'Memproses Gateway...' : (step < 3 ? 'Lanjutkan' : 'Bayar Sekarang (Midtrans Snap)')} <ArrowRight size={16} /></button></div></>}
      {modal === 'payment' && <><div className="modal-kicker">SECURE CHECKOUT <span className="payment-timer"><Clock3 size={14} /> 14:32</span></div><h2>Amankan slotmu.</h2><div className="order-summary"><span>{selected.title}<small>Registration fee</small></span><b>Rp {formatIDR(selected.price)}</b><span>Donasi pelestarian budaya<small>Opsional · 2% dari biaya</small></span><b>Rp {formatIDR(Math.round(selected.price * .02))}</b><span>Biaya admin</span><b>Rp 5.000</b><hr /><strong>Total pembayaran</strong><strong>Rp {formatIDR(selected.price + Math.round(selected.price * .02) + 5000)}</strong></div><div className="payment-tabs">{['QRIS', 'Virtual Account', 'E-Wallet'].map(p => <button className={p === 'QRIS' ? 'active' : ''} key={p}>{p}</button>)}</div><div className="payment-box"><QrCode size={110} /><span>Silakan selesaikan pembayaran via popup Midtrans Snap</span></div><button className="btn btn-primary full" onClick={() => setModal('pass')}>Lihat E-Ticket & Race Pass <Check size={17} /></button></>}
      {modal === 'pass' && <>
        <div className="modal-kicker">DIGITAL RACE PASS <span className="status ready">● READY</span></div>
        <h2>See you at the start.</h2>

        {isConfirming && !ticketData && (
          <div style={{ background: '#fff9e6', border: '1px solid #ffd166', color: '#8a6d00', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #8a6d00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Menyiapkan E-Ticket & memverifikasi nomor BIB resmi...
          </div>
        )}

        <div className="race-pass" id="printable-race-pass">
          <div className="pass-head">
            <span>CULTURACE</span>
            <b>2026</b>
          </div>
          <div className="pass-name">
            <small>RUNNER</small>
            <strong>{ticketData?.user_name || completedOrder?.name || formData.name || 'PESERTA CULTURACE'}</strong>
            <span>{ticketData?.category ? `${ticketData.category} Fun Run` : (completedOrder?.category || selected.title)}</span>
          </div>
          <div className="pass-bottom" style={{ alignItems: 'center' }}>
            <div>
              <small>NOMOR BIB RESMI</small>
              <b style={{ fontSize: '18px', color: '#a91024', fontFamily: 'monospace' }}>
                {ticketData?.bib_number || completedOrder?.bib || (completedOrder?.orderId ? `#${completedOrder.orderId.slice(-4)}` : '5K-001')}
              </b>
            </div>
            <div>
              <small>JERSEY</small>
              <b>SIZE {ticketData?.jersey_size || completedOrder?.size || size}</b>
            </div>
            <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', border: '1px solid #eadfd6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG
                value={ticketData?.qr_code_token || ticketData?.bib_number || completedOrder?.orderId || 'CULT-5K-CULTURACE'}
                size={80}
                level="M"
              />
            </div>
          </div>
          {ticketData?.qr_code_token && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e8ddd3', textAlign: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a7772' }}>
                {ticketData.qr_code_token}
              </span>
            </div>
          )}
        </div>

        <div style={{ background: '#eafaf1', color: '#137333', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', marginBottom: '18px' }}>
          ✓ Bukti nota pembayaran & e-ticket digital telah dikirimkan ke email <b>{ticketData?.user_email || formData.email || 'peserta'}</b> dan WhatsApp <b>{ticketData?.user_phone || formData.phone}</b>.
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary full"
            disabled={!ticketData}
            style={{
              padding: '14px 20px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: !ticketData ? 0.7 : 1,
              cursor: !ticketData ? 'not-allowed' : 'pointer'
            }}
            onClick={() => {
              if (ticketData?.qr_code_token) {
                window.open(`/ticket/${ticketData.qr_code_token}?print=true`, '_blank');
              }
            }}
          >
            {ticketData ? (
              <>
                <Download size={17} /> Cetak / Unduh PDF E-Ticket Resmi
              </>
            ) : (
              <>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Menyiapkan PDF E-Ticket Resmi...
              </>
            )}
          </button>
        </div>
      </>}</div></div>}
  </main>
}
