'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Copy, Crosshair, Droplets, Flag, Gem, MapPin, Menu, QrCode, Search, ShieldCheck, Sparkles, Trophy, X, Zap } from 'lucide-react'

const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => <div style={{ height: '420px', display: 'grid', placeItems: 'center', background: '#fffaf1', border: '1px solid #e2d6ca', color: '#8a7772', fontFamily: 'monospace' }}>Memuat Peta Interaktif & Elevasi...</div>
})

const categories = [
  { id: '5K', title: '5K Fun Run', subtitle: 'Lari Santai · Early bird', price: 150000, regularPrice: 175000, tone: 'light', popular: true },
]
const runners = [
  ['01', 'Dimas Pratama', '0108', 'Candi Jawi', '00:41:08', '00:41:08'], ['02', 'Nadia Kirana', '0223', 'Masjid Moekhlas Sidik', '00:42:19', '00:42:19'], ['03', 'Raka Aditya', '0091', 'Kaliandra', '00:43:44', '00:43:44'], ['04', 'Sari Wulandari', '0177', 'Pos 2', '00:45:12', '00:45:12'], ['05', 'Bagas Nugroho', '0314', 'Masjid Moekhlas Sidik', '00:46:03', '00:46:03']
]
const formatIDR = (n: number) => new Intl.NumberFormat('id-ID').format(n)

export default function Home() {
  const [modal, setModal] = useState<'register' | 'payment' | 'pass' | 'scanner' | null>(null)
  const [selected, setSelected] = useState(categories[0])
  const [step, setStep] = useState(1)
  const [size, setSize] = useState('M')
  const [bib, setBib] = useState('NADIA')
  const [payment, setPayment] = useState('QRIS')
  const [scanned, setScanned] = useState(false)
  const [leaderFilter, setLeaderFilter] = useState('Semua')
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const visibleRunners = useMemo(() => runners.filter(r => (leaderFilter === 'Semua' || (leaderFilter === '5K' ? r[2] === '0108' : true)) && r.join(' ').toLowerCase().includes(query.toLowerCase())), [query, leaderFilter])
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
      <a href="#top" className="brand brand-header" aria-label="CULTURACE - Masjid Moekhlas Sidik Race Edition">
        <img
          src="/culturace-ruby.png"
          alt="CULTURACE Logo"
          className="brand-logo-img"
        />
        <div className="brand-badge-box">
          <span className="brand-edition-capsule">
            <span className="brand-edition-dot" />
            MASJID MOEKHLAS SIDIK RACE EDITION
          </span>
        </div>
      </a>
      <div className="navlinks">
        <a href="#categories">Categories</a>
        <a href="#route">Route & Elevation</a>
        <a href="#leaderboard">Live Leaderboard</a>
        <a href="#pass">Race Pass</a>
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
                  MASJID MOEKHLAS SIDIK RACE EDITION
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

    <section className="hero" id="top"><div className="hero-pattern" /><div className="hero-content"><div className="eyebrow"><span /> PANDAAN — PASURUAN CULTURAL HERITAGE RUN</div><h1>Lari melintasi<br /><em>keagungan budaya</em><br />dan landmark merah.</h1><p>Rasakan energi Pasuruan dalam satu langkah. Menyusuri jejak heritage, sawah hijau, dan arsitektur Masjid Moekhlas Sidik yang ikonik.</p><div className="hero-actions"><button className="btn btn-gold" onClick={() => openRegister()}>Daftar Sekarang <ArrowRight size={17} /></button><a className="text-link" href="#route">Jelajahi rute <ChevronRight size={17} /></a></div><div className="stats"><div><strong>1,500+<span>+</span></strong><small>RUNNERS</small></div><div><strong>1</strong><small>KATEGORI</small></div><div><strong>Rp 20<span>jt</span></strong><small>PRIZE POOL</small></div></div></div><div className="hero-art"><div className="arch arch-back" /><div className="arch arch-front"><div className="dome">C</div><div className="stairs" /></div><div className="art-caption"><MapPin size={14} /> Masjid Moekhlas Sidik · PANDAAN</div></div></section>
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
    <section className="section categories-section" id="categories"><div className="section-heading"><div><span className="kicker">ONE RACE ONE STORY</span></div><p>Setiap kategori dirancang untuk menghadirkan pengalaman budaya yang berbeda. Temukan jarak yang sesuai dengan ceritamu.</p></div><div className="category-grid">{categories.map(cat => <article className={`category-card ${cat.tone}`} key={cat.id}>{cat.popular && <span className="popular">MOST POPULAR</span>}<div className="category-top"><span className="distance">{cat.id}</span><span className="category-icon"><Zap size={18} /></span></div><h3>{cat.title}</h3><p>{cat.subtitle}</p><strong className="price">Rp {formatIDR(cat.price)} <del>Rp {formatIDR(cat.regularPrice)}</del></strong><small className="early-bird">EARLY BIRD · HEMAT Rp {formatIDR(cat.regularPrice - cat.price)}</small><ul>{['Jersey Dry-Fit Batik Pasuruan', 'Finisher medal logam emas', 'BIB number + timing chip', 'Refreshments sepanjang rute', 'Asuransi perlombaan'].map(item => <li key={item}><Check size={15} />{item}</li>)}</ul><button className="btn btn-outline" onClick={() => openRegister(cat)}>Pilih Kategori <ArrowRight size={15} /></button></article>)}</div></section>
    <section className="section route-section" id="route">
      <div className="section-heading">
        <div>
          <span className="kicker">THE RED LOOP</span>
          <h2>Rute yang<br /><em>punya cerita.</em></h2>
        </div>
        <p>Dari pelataran Masjid Moekhlas Sidik, melewati warisan budaya dan kontur alam Pandaan. Setiap kilometer adalah bab baru.</p>
        <small className="route-address">
          <MapPin size={14} /> Jalan Sukorame, Durensewu, Pandaan, Pasuruan 67156 ·
          <a href="https://www.google.com/maps/dir/?api=1&destination=-7.6712,112.6983" target="_blank" rel="noreferrer">
            Navigasi Google Maps Asli
          </a>
        </small>
      </div>
      <RaceMap />
    </section>
    <section className="section leaderboard-section" id="leaderboard"><div className="leader-top"><div><span className="kicker">LIVE RACE DATA</span><h2>Siapa yang<br /><em>memimpin?</em></h2></div><div className="live-badge"><span /> LIVE UPDATING <small>per 30 seconds</small></div></div><div className="leader-tools"><div className="search"><Search size={17} /><input placeholder="Cari nama atau BIB..." value={query} onChange={e => setQuery(e.target.value)} /></div><div className="filter-tabs">{['Semua', '5K', '10K', '21K'].map(f => <button key={f} className={leaderFilter === f ? 'active' : ''} onClick={() => setLeaderFilter(f)}>{f}</button>)}</div></div><div className="leader-table"><div className="table-head"><span>RANK</span><span>RUNNER</span><span>LAST CHECKPOINT</span><span>SPLIT TIME</span><span>NET TIME</span></div>{visibleRunners.map((r, i) => <div className="table-row" key={r[2]}><strong className={i < 3 ? `medal medal-${i + 1}` : ''}>{r[0]}</strong><div className="runner"><span>{r[1].split(' ').map(x => x[0]).join('').slice(0, 2)}</span><b>{r[1]}</b><small>BIB #{r[2]}</small></div><span>{r[3]}</span><span>{r[4]}</span><strong>{r[5]}</strong></div>)}</div></section>
    <footer>
      <div className="brand brand-footer">
        <img
          src="/culturace-white.png"
          alt="CULTURACE Logo"
          className="brand-logo-img brand-logo-footer"
        />
        <div className="brand-badge-box">
          <span className="brand-edition-capsule brand-capsule-footer">
            <span className="brand-edition-dot brand-dot-gold" />
            MASJID MOEKHLAS SIDIK RACE EDITION
          </span>
        </div>
      </div>
      <span>RUN WITH CULTURE · RUN WITH PURPOSE</span>
      <span>© 2026 CULTURACE</span>
    </footer>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className={`modal ${modal === 'scanner' ? 'scanner-modal' : ''}`} onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>{modal === 'register' && <><div className="modal-kicker">CULTURACE REGISTRATION</div><h2>Mulai langkahmu.</h2><div className="stepper">{['Data diri', 'Perlengkapan', 'Review'].map((s, i) => <div className={step >= i + 1 ? 'done' : ''} key={s}><span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>{s}</div>)}</div>{step === 1 && <div className="form-grid"><label>Nama lengkap<input placeholder="Nama sesuai identitas" /></label><label>Email aktif<input type="email" placeholder="kamu@email.com" /></label><label>No. WhatsApp<input placeholder="08xx xxxx xxxx" /></label><label>Kontak darurat<input placeholder="Nama · nomor telepon" /></label><div className="selected-category"><small>KATEGORI PILIHAN</small><b>{selected.title}</b><span>Rp {formatIDR(selected.price)}</span></div></div>}{step === 2 && <div className="gear-step"><div className="jersey-preview"><div className="jersey">C<span>RACE<br />WITH<br />CULTURE</span></div><div className="jersey-toggle">FRONT / BACK</div></div><div><label>BIB NAME<input value={bib} onChange={e => setBib(e.target.value.toUpperCase().slice(0, 12))} /></label><div className="bib-preview"><small>LIVE BIB PREVIEW</small><b>{bib || 'YOUR NAME'}</b><span>#{selected.id === '10K' ? '0223' : '0108'}</span></div><label className="size-label">UKURAN JERSEY</label><div className="sizes">{['S', 'M', 'L', 'XL', 'XXL'].map(s => <button className={size === s ? 'active' : ''} key={s} onClick={() => setSize(s)}>{s}</button>)}</div></div></div>}{step === 3 && <div className="review"><div><span>RUNNER</span><b>{bib || 'Nadia Kirana'}</b></div><div><span>KATEGORI</span><b>{selected.title}</b></div><div><span>JERSEY</span><b>Size {size}</b></div><div><span>TOTAL</span><b>Rp {formatIDR(selected.price)}</b></div><p><ShieldCheck size={17} /> Data aman dan terlindungi.</p></div>}<div className="modal-actions"><button className="btn btn-ghost" onClick={() => step > 1 ? setStep(step - 1) : setModal(null)}>{step > 1 ? 'Kembali' : 'Batal'}</button><button className="btn btn-primary" onClick={() => step < 3 ? setStep(step + 1) : goPayment()}>{step < 3 ? 'Lanjutkan' : 'Ke Pembayaran'} <ArrowRight size={16} /></button></div></>}{modal === 'payment' && <><div className="modal-kicker">SECURE CHECKOUT <span className="payment-timer"><Clock3 size={14} /> 14:32</span></div><h2>Amankan slotmu.</h2><div className="order-summary"><span>{selected.title}<small>Registration fee</small></span><b>Rp {formatIDR(selected.price)}</b><span>Donasi pelestarian budaya<small>Opsional · 2% dari biaya</small></span><b>Rp {formatIDR(Math.round(selected.price * .02))}</b><span>Biaya admin</span><b>Rp 5.000</b><hr /><strong>Total pembayaran</strong><strong>Rp {formatIDR(selected.price + Math.round(selected.price * .02) + 5000)}</strong></div><div className="payment-tabs">{['QRIS', 'Virtual Account', 'E-Wallet'].map(p => <button className={payment === p ? 'active' : ''} key={p} onClick={() => setPayment(p)}>{p}</button>)}</div><div className="payment-box">{payment === 'QRIS' ? <><QrCode size={110} /><span>Scan dengan aplikasi pembayaranmu</span></> : <><b>{payment === 'Virtual Account' ? 'BCA Virtual Account' : 'GoPay / OVO / DANA'}</b><div className="va-number">8808 1022 3000 <Copy size={16} /></div><small>Berlaku selama 15 menit</small></>}</div><button className="btn btn-primary full" onClick={() => setModal('pass')}>Konfirmasi Pembayaran Selesai <Check size={17} /></button></>}{modal === 'pass' && <><div className="modal-kicker">DIGITAL RACE PASS <span className="status ready">● READY</span></div><h2>See you at the start.</h2><div className="race-pass"><div className="pass-head"><span>CULTURACE</span><b>2026</b></div><div className="pass-name"><small>RUNNER</small><strong>{bib || 'NADIA KIRANA'}</strong><span>10K HERITAGE CHALLENGE</span></div><div className="pass-bottom"><div><small>BIB NUMBER</small><b>#0223</b></div><div><small>JERSEY</small><b>SIZE {size}</b></div><QrCode size={65} /></div></div><button className="btn btn-primary full" onClick={() => setModal('scanner')}>Buka Marshal Scanner <Crosshair size={17} /></button></>}{modal === 'scanner' && <><div className="scanner-head"><span>MARSHAL SCANNER</span><span className="status ready">● ONLINE</span></div><h2>Scan race pass.</h2><div className="viewfinder"><div className="corner tl" /><div className="corner tr" /><div className="corner bl" /><div className="corner br" />{scanned && <div className="scan-result"><Check size={22} /><b>VALID RACE PASS</b><small>Nadia Kirana · BIB #0223</small></div>}</div>{scanned ? <button className="btn btn-primary full" onClick={() => setModal('pass')}>Konfirmasi Pengambilan & Cetak BIB <Check size={17} /></button> : <button className="btn btn-gold full" onClick={() => setScanned(true)}>Simulasikan Scan QR <QrCode size={17} /></button>}</>}</div></div>}
  </main>
}
