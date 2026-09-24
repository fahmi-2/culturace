'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Flag, Sparkles, Droplets, ShieldCheck, MapPin, Play, Pause, RotateCcw } from 'lucide-react'

// Coordinate route Pandaan - Durensewu - Masjid Merah Moekhlas Sidik loop
// Elevation profile matches each point along the track
export interface RoutePoint {
  lat: number
  lng: number
  name: string
  distKm: number
  elevation: number
  type?: 'start' | 'finish' | 'ws' | 'cheer' | 'medical' | 'landmark' | 'waypoint'
  desc?: string
}

export const ROUTE_POINTS: RoutePoint[] = [
  { lat: -7.67120, lng: 112.69830, name: 'Masjid Merah Moekhlas Sidik', distKm: 0.0, elevation: 110, type: 'start', desc: 'Start Line · Pelataran Masjid Merah Moekhlas Sidik' },
  { lat: -7.67380, lng: 112.70050, name: 'Jl. Raya Sukorame', distKm: 0.8, elevation: 122, type: 'waypoint', desc: 'Kawasan Perkebunan & Desa' },
  { lat: -7.67810, lng: 112.70320, name: 'Water Station 1 (WS 01)', distKm: 1.5, elevation: 142, type: 'ws', desc: 'Air mineral, isotonic & sponge' },
  { lat: -7.68350, lng: 112.70580, name: 'Pintu Gerbang Taman Dayu Selatan', distKm: 2.3, elevation: 165, type: 'waypoint', desc: 'Jalan rindang pohon pinus' },
  { lat: -7.68720, lng: 112.70910, name: 'Cheer Zone - Tari Tradisional Pandaan', distKm: 3.1, elevation: 182, type: 'cheer', desc: 'Pentas gamelan & penari Pasuruan' },
  { lat: -7.68450, lng: 112.71350, name: 'Medical Station & U-Turn', distKm: 3.8, elevation: 175, type: 'medical', desc: 'Tim medis, ambulans & fisioterapi' },
  { lat: -7.67920, lng: 112.71040, name: 'Jalur Hijau Durensewu', distKm: 4.4, elevation: 148, type: 'waypoint', desc: 'Pemandangan terasering sawah' },
  { lat: -7.67450, lng: 112.70420, name: 'Simpang Heritage Pandaan', distKm: 4.8, elevation: 125, type: 'waypoint', desc: 'Pintu masuk menuju garis finish' },
  { lat: -7.67120, lng: 112.69830, name: 'Finish Line Masjid Merah Moekhlas Sidik', distKm: 5.0, elevation: 110, type: 'finish', desc: 'Pengambilan medali & refreshment finish' },
]

export default function InteractiveRaceMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const runnerMarkerRef = useRef<L.CircleMarker | null>(null)
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null)

  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)

  const activePoint = ROUTE_POINTS[activeIndex]

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialPoint = ROUTE_POINTS[0]
    const map = L.map(mapContainerRef.current, {
      center: [initialPoint.lat, initialPoint.lng],
      zoom: 14,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Draw route polyline
    const latlngs: L.LatLngExpression[] = ROUTE_POINTS.map(p => [p.lat, p.lng])

    // Background glow line
    L.polyline(latlngs, {
      color: '#f3ba61',
      weight: 8,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    // Primary route line
    const routeLine = L.polyline(latlngs, {
      color: '#a91024',
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    // Fit map bounds to polyline
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] })

    // Add point markers
    ROUTE_POINTS.forEach((pt, idx) => {
      if (pt.type === 'waypoint') return

      let iconColor = '#a91024'
      let label = `${pt.distKm} km`
      if (pt.type === 'start' || pt.type === 'finish') {
        iconColor = '#a91024'
        label = pt.type === 'start' ? 'START' : 'FINISH'
      } else if (pt.type === 'ws') {
        iconColor = '#2f9bba'
        label = 'WS 01'
      } else if (pt.type === 'cheer') {
        iconColor = '#d9a33c'
        label = 'CHEER'
      } else if (pt.type === 'medical') {
        iconColor = '#138967'
        label = 'MEDIC'
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:${iconColor};color:#fff;font-size:9px;font-weight:bold;padding:3px 7px;border-radius:12px;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.35);white-space:nowrap;">${label}</div>`,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      })

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;padding:4px;">
          <strong style="color:#a91024;display:block;font-size:13px;margin-bottom:2px;">${pt.name}</strong>
          <div style="color:#555;margin-bottom:4px;">${pt.desc || ''}</div>
          <div style="font-size:11px;font-family:monospace;color:#222;">
            Jarak: <b>${pt.distKm} km</b> | Elevasi: <b>${pt.elevation} mdpl</b>
          </div>
        </div>
      `)
      marker.on('click', () => {
        setActiveIndex(idx)
      })
    })

    // Runner marker (live tracked position)
    const runnerMarker = L.circleMarker([initialPoint.lat, initialPoint.lng], {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#c71932',
      fillOpacity: 1,
    }).addTo(map)

    // Add pulse effect around runner
    runnerMarkerRef.current = runnerMarker
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update runner marker on activeIndex change
  useEffect(() => {
    if (!runnerMarkerRef.current || !mapInstanceRef.current) return
    const pt = ROUTE_POINTS[activeIndex]
    runnerMarkerRef.current.setLatLng([pt.lat, pt.lng])
    mapInstanceRef.current.panTo([pt.lat, pt.lng], { animate: true, duration: 0.5 })
  }, [activeIndex])

  // Playback simulation
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= ROUTE_POINTS.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1800 / playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed])

  // SVG Elevation calculation
  const maxElev = 200
  const minElev = 90
  const svgWidth = 520
  const svgHeight = 170

  const getSvgX = (dist: number) => {
    const totalDist = ROUTE_POINTS[ROUTE_POINTS.length - 1].distKm
    return (dist / totalDist) * svgWidth
  }

  const getSvgY = (elev: number) => {
    return svgHeight - ((elev - minElev) / (maxElev - minElev)) * (svgHeight - 40) - 20
  }

  const pointsString = ROUTE_POINTS.map(p => `${getSvgX(p.distKm)},${getSvgY(p.elevation)}`).join(' ')
  const areaPath = `M 0,${svgHeight} L ${pointsString} L ${svgWidth},${svgHeight} Z`
  const currentX = getSvgX(activePoint.distKm)
  const currentY = getSvgY(activePoint.elevation)

  return (
    <div className="route-layout">
      {/* MAP VIEW */}
      <div className="route-map-wrapper">
        <div ref={mapContainerRef} className="realtime-map-view" />

        {/* Map Header Overlay */}
        <div className="map-realtime-overlay">
          <div className="live-indicator">
            <span className="pulse-dot" />
            <b>LIVE GPS ROUTE</b>
            <small>5K Cultural Loop Pandaan</small>
          </div>
          <div className="direct-route-btn">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=-7.6712,112.6983"
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold btn-sm"
            >
              <MapPin size={13} /> Direct Google Maps
            </a>
          </div>
        </div>

        {/* Simulation Control Bar */}
        <div className="route-sim-bar">
          <button
            type="button"
            className="sim-btn"
            onClick={() => {
              if (activeIndex >= ROUTE_POINTS.length - 1) setActiveIndex(0)
              setIsPlaying(!isPlaying)
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Simulasi' : 'Putar Simulasi Rute'}</span>
          </button>

          <button
            type="button"
            className="sim-icon-btn"
            title="Reset"
            onClick={() => {
              setIsPlaying(false)
              setActiveIndex(0)
            }}
          >
            <RotateCcw size={14} />
          </button>

          <div className="sim-speed">
            <button
              type="button"
              className={playbackSpeed === 1 ? 'active' : ''}
              onClick={() => setPlaybackSpeed(1)}
            >
              1x
            </button>
            <button
              type="button"
              className={playbackSpeed === 2 ? 'active' : ''}
              onClick={() => setPlaybackSpeed(2)}
            >
              2x
            </button>
          </div>

          <div className="sim-status">
            Checkpoint: <b>{activePoint.name}</b> ({activePoint.distKm} km)
          </div>
        </div>
      </div>

      {/* REALTIME ELEVATION VIEW */}
      <div className="elevation-realtime-card">
        <div className="elev-top">
          <div>
            <span className="elev-tag">PROFILE ELEVATION · REALTIME</span>
            <h4 className="elev-location-title">{activePoint.name}</h4>
          </div>
          <div className="elev-value-box">
            <strong>+{activePoint.elevation} <small>mdpl</small></strong>
            <span className="elev-km-badge">{activePoint.distKm.toFixed(1)} KM</span>
          </div>
        </div>

        {/* Elevation interactive chart */}
        <div className="elevation-chart-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="elev-svg">
            <defs>
              <linearGradient id="elevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8aa3b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#a91024" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1={getSvgY(120)} x2={svgWidth} y2={getSvgY(120)} stroke="#e8dcd2" strokeDasharray="3 3" />
            <line x1="0" y1={getSvgY(160)} x2={svgWidth} y2={getSvgY(160)} stroke="#e8dcd2" strokeDasharray="3 3" />

            {/* Filled Area */}
            <path d={areaPath} fill="url(#elevGrad)" />

            {/* Elevation line */}
            <polyline
              points={pointsString}
              fill="none"
              stroke="#a91024"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Checkpoint dots */}
            {ROUTE_POINTS.map((pt, i) => (
              <circle
                key={pt.name + i}
                cx={getSvgX(pt.distKm)}
                cy={getSvgY(pt.elevation)}
                r={activeIndex === i ? '6' : '3.5'}
                fill={activeIndex === i ? '#a91024' : '#fff'}
                stroke="#a91024"
                strokeWidth={activeIndex === i ? '3' : '2'}
                className="elev-node"
                onClick={() => setActiveIndex(i)}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {/* Current Realtime Position Marker on SVG */}
            <line
              x1={currentX}
              y1="0"
              x2={currentX}
              y2={svgHeight}
              stroke="#a91024"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle cx={currentX} cy={currentY} r="7" fill="#c71932" stroke="#fff" strokeWidth="2.5" />
          </svg>

          <div className="elev-axis-labels">
            <span>KM 0 (Start 110m)</span>
            <span>KM 2.5 (Taman Dayu)</span>
            <span>KM 3.1 (Peak 182m)</span>
            <span>KM 5 (Finish 110m)</span>
          </div>
        </div>

        {/* Realtime Checkpoint Info Card */}
        <div className="checkpoint-detail-pill">
          <div className="detail-icon">
            {activePoint.type === 'start' || activePoint.type === 'finish' ? <Flag size={16} /> :
              activePoint.type === 'ws' ? <Droplets size={16} /> :
                activePoint.type === 'cheer' ? <Sparkles size={16} /> :
                  activePoint.type === 'medical' ? <ShieldCheck size={16} /> :
                    <MapPin size={16} />}
          </div>
          <div className="detail-text">
            <b>{activePoint.desc || activePoint.name}</b>
            <p>
              Koordinat: <code>{activePoint.lat.toFixed(4)}, {activePoint.lng.toFixed(4)}</code> · Kemiringan rute: {activePoint.elevation > 150 ? 'Tanjakan Sedang' : 'Landai / Datar'}
            </p>
          </div>
        </div>

        {/* Quick Checkpoint selector */}
        <div className="checkpoint-selector">
          <span className="selector-label">Lompat ke Titik Rute:</span>
          <div className="checkpoint-chips">
            {ROUTE_POINTS.filter(p => p.type !== 'waypoint').map((pt) => {
              const originalIndex = ROUTE_POINTS.indexOf(pt)
              const isSelected = activeIndex === originalIndex
              return (
                <button
                  type="button"
                  key={pt.name}
                  className={`chip-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveIndex(originalIndex)}
                >
                  {pt.distKm} km · {pt.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
