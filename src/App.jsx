import React, { useState, useMemo, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts'
import { useMetaData, ConnStatus, fmtMoney, fmtNum, fmtPct, fmtX, findAction, bestRoas } from './meta'

/* ── COLORES ──────────────────────────────────────────────── */
const AC  = '#C8714A'
const ACL = '#e8916a'
const GR  = '#4ADE80'
const AM  = '#fbbf24'
const RE  = '#f87171'
const BL  = '#60a5fa'
const PU  = '#a78bfa'
const BG  = '#0d0d0d'
const CRD = '#161616'
const BRD = '#282828'
const TXT = '#FFFFFF'
const SEC = '#8C8C8C'

/* ── DATOS DIARIOS (60 días) ─────────── */
function generateDailyData() {
  const data = []
  const today = new Date()
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const spend = Math.round(1800000 + Math.sin(i / 3) * 300000 + Math.random() * 500000)
    const impressions = Math.round(260000 + Math.random() * 80000)
    const clicks = Math.round(impressions * (0.028 + Math.random() * 0.012))
    const cpaTarget = 45000 + Math.random() * 25000
    const purchases = Math.max(1, Math.round(spend / cpaTarget))
    const roasBase = 3.8 + Math.random() * 1.4
    const revenue = Math.round(spend * roasBase)
    const addToCart = Math.round(clicks * (0.22 + Math.random() * 0.08))
    const checkout = Math.round(addToCart * (0.42 + Math.random() * 0.1))
    data.push({
      date: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      spend, impressions, clicks, purchases, revenue, addToCart, checkout,
      ctr: +((clicks / impressions) * 100).toFixed(2),
      cpc: Math.round(spend / clicks),
      cpa: Math.round(spend / purchases),
      roas: +(revenue / spend).toFixed(2),
    })
  }
  return data
}
const DAILY = generateDailyData()

/* ── CAMPAÑAS ─────────────────────────────────────────────── */
const CAMPAIGNS = [
  { id:1, name:'Prospecting - Raquetas Premium',   status:'ACTIVE', budget:650000, spend:18500000, impressions:1820000, clicks:58000, purchases:310, ctr:3.19, cpc:319, cpa:59677, roas:5.2 },
  { id:2, name:'Retargeting - Carrito Abandonado', status:'ACTIVE', budget:450000, spend:12300000, impressions:980000,  clicks:38500, purchases:285, ctr:3.93, cpc:319, cpa:43158, roas:6.8 },
  { id:3, name:'Lookalike - Compradores',          status:'ACTIVE', budget:350000, spend:9800000,  impressions:1100000, clicks:32000, purchases:170, ctr:2.91, cpc:306, cpa:57647, roas:4.5 },
  { id:4, name:'Conversión - Zapatillas',          status:'ACTIVE', budget:320000, spend:8900000,  impressions:780000,  clicks:28000, purchases:165, ctr:3.59, cpc:318, cpa:53939, roas:4.9 },
  { id:5, name:'Brand Awareness - Tenis',          status:'ACTIVE', budget:280000, spend:7600000,  impressions:2100000, clicks:39000, purchases:85,  ctr:1.86, cpc:195, cpa:89412, roas:2.4 },
  { id:6, name:'Video Ads - Tutoriales',           status:'PAUSED', budget:180000, spend:4200000,  impressions:890000,  clicks:19100, purchases:52,  ctr:2.15, cpc:220, cpa:80769, roas:2.8 },
]

/* ── CREATIVIDADES ────────────────────────────────────────── */
const CREATIVES = [
  { id:1, emoji:'🎾', name:'Raqueta Head Speed Pro - Carrusel',   campaign:'Prospecting - Raquetas',  format:'Carrusel', spend:5200000, impressions:520000, clicks:19760, ctr:3.80, roas:6.2 },
  { id:2, emoji:'🎥', name:'Video Dinámico - Carrito 15s',        campaign:'Retargeting - Carrito',    format:'Video',    spend:4800000, impressions:380000, clicks:15580, ctr:4.10, roas:7.3 },
  { id:3, emoji:'🏷️', name:'Oferta Flash - 20% OFF',               campaign:'Lookalike - Compradores',  format:'Imagen',   spend:3200000, impressions:410000, clicks:11890, ctr:2.90, roas:4.2 },
  { id:4, emoji:'👟', name:'Nike Air Zoom Vapor - Stories',        campaign:'Conversión - Zapatillas',  format:'Stories',  spend:2900000, impressions:290000, clicks:10150, ctr:3.50, roas:4.8 },
  { id:5, emoji:'🎬', name:'¿Eres tenista? - Video 30s',           campaign:'Brand Awareness',           format:'Video',    spend:2100000, impressions:680000, clicks:12920, ctr:1.90, roas:2.0 },
  { id:6, emoji:'🏆', name:'Roland Garros 2026 - Colección',       campaign:'Temporada - Torneos',       format:'Colección',spend:1800000, impressions:225000, clicks:6975,  ctr:3.10, roas:3.9 },
  { id:7, emoji:'🎾', name:'Wilson Pro Staff - Imagen Única',      campaign:'Prospecting - Raquetas',   format:'Imagen',   spend:1600000, impressions:198000, clicks:5346,  ctr:2.70, roas:3.5 },
  { id:8, emoji:'⭐', name:'Testimonio Cliente - Video 20s',       campaign:'Retargeting',               format:'Video',    spend:2400000, impressions:195000, clicks:8775,  ctr:4.50, roas:8.1 },
  { id:9, emoji:'📺', name:'Tutorial Saque - Nivel Avanzado',      campaign:'Video Ads - Tutoriales',    format:'Video',    spend:890000,  impressions:215000, clicks:3870,  ctr:1.80, roas:1.5 },
]

/* ── AUDIENCIAS ───────────────────────────────────────────── */
const AGE_GENDER = [
  { age:'18-24', male:450000, female:380000, roas:4.1 },
  { age:'25-34', male:890000, female:720000, roas:5.2 },
  { age:'35-44', male:650000, female:510000, roas:4.8 },
  { age:'45-54', male:320000, female:270000, roas:3.9 },
  { age:'55+',   male:180000, female:140000, roas:3.2 },
]
const DEVICES = [
  { name:'Móvil',      value:68 },
  { name:'Escritorio', value:24 },
  { name:'Tablet',     value:8 },
]
const GEO = [
  { country:'Colombia',  flag:'🇨🇴', spend:38500000, impressions:3820000, clicks:121000, roas:4.8 },
  { country:'México',    flag:'🇲🇽', spend:9200000,  impressions:890000,  clicks:28000,  roas:3.9 },
  { country:'Argentina', flag:'🇦🇷', spend:5800000,  impressions:560000,  clicks:17500,  roas:3.5 },
  { country:'España',    flag:'🇪🇸', spend:4200000,  impressions:410000,  clicks:13000,  roas:4.1 },
  { country:'Chile',     flag:'🇨🇱', spend:2900000,  impressions:285000,  clicks:9000,   roas:3.7 },
  { country:'Perú',      flag:'🇵🇪', spend:1800000,  impressions:175000,  clicks:5500,   roas:3.2 },
  { country:'Ecuador',   flag:'🇪🇨', spend:890000,   impressions:87000,   clicks:2700,   roas:2.9 },
  { country:'Uruguay',   flag:'🇺🇾', spend:520000,   impressions:51000,   clicks:1600,   roas:3.0 },
]
const PLACEMENTS = [
  { name:'Facebook Feed',    spend:22000000, roas:4.9 },
  { name:'Instagram Feed',   spend:18500000, roas:4.6 },
  { name:'IG Stories',       spend:9800000,  roas:3.8 },
  { name:'IG Reels',         spend:7200000,  roas:4.2 },
  { name:'Audience Network', spend:3100000,  roas:2.8 },
  { name:'FB Stories',       spend:2800000,  roas:3.4 },
]
const INTERESTS = [
  { name:'Tenis',              audience:2400000, engagement:5.2 },
  { name:'Padel',              audience:1100000, engagement:4.8 },
  { name:'Deportes de raqueta',audience:1800000, engagement:4.5 },
  { name:'Wilson / Head',      audience:680000,  engagement:6.1 },
  { name:'Roland Garros',      audience:540000,  engagement:5.9 },
  { name:'Nike Tennis',        audience:820000,  engagement:5.5 },
]

/* ── HELPERS ──────────────────────────────────────────────── */
const fmtCOP   = n => '$' + (n / 1000000).toFixed(1) + 'M'
const fmtNum   = n => n >= 1000000 ? (n / 1000000).toFixed(2) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString()
const fmtMoney = n => '$' + Math.round(n).toLocaleString('es-CO')

/* ── COMPONENTES BÁSICOS ──────────────────────────────────── */
function Card({ children, style }) {
  return <div style={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:12, padding:20, ...style }}>{children}</div>
}
function KpiCard({ label, value, delta, sub }) {
  const positive = delta && delta > 0
  return (
    <Card>
      <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:TXT, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ color:SEC, fontSize:12, marginBottom:4 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ color:positive ? GR : RE, fontSize:12 }}>
          {positive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs período anterior
        </div>
      )}
    </Card>
  )
}
function RangeSelector({ value, onChange }) {
  const opts = [
    { k:'1',   label:'Hoy' },
    { k:'7',   label:'7 días' },
    { k:'15',  label:'15 días' },
    { k:'30',  label:'30 días' },
    { k:'cal', label:'📅 Calendario' },
  ]
  return (
    <div style={{ display:'flex', gap:6, background:CRD, border:`1px solid ${BRD}`, padding:4, borderRadius:10 }}>
      {opts.map(o => (
        <button key={o.k} onClick={() => onChange(o.k)}
          style={{
            background: value === o.k ? AC : 'transparent',
            color: value === o.k ? '#000' : TXT,
            border:'none', padding:'8px 14px', borderRadius:8,
            fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
          }}>{o.label}</button>
      ))}
    </div>
  )
}
function Calendar({ data, selectedDate, onSelect }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const record = data.find(r => r.date === iso)
    cells.push({ day:d, iso, record })
  }
  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) } else setViewMonth(viewMonth - 1) }
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) } else setViewMonth(viewMonth + 1) }
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <button onClick={prev} style={{ background:'transparent', color:TXT, border:`1px solid ${BRD}`, borderRadius:8, padding:'6px 12px', cursor:'pointer' }}>◀</button>
        <div style={{ fontSize:16, fontWeight:600 }}>{monthNames[viewMonth]} {viewYear}</div>
        <button onClick={next} style={{ background:'transparent', color:TXT, border:`1px solid ${BRD}`, borderRadius:8, padding:'6px 12px', cursor:'pointer' }}>▶</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:8 }}>
        {dayNames.map(n => <div key={n} style={{ textAlign:'center', color:SEC, fontSize:11, padding:4 }}>{n}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />
          const selected = selectedDate === c.iso
          const hasData = !!c.record
          return (
            <button key={i} onClick={() => hasData && onSelect(c.iso)} disabled={!hasData}
              style={{
                aspectRatio:'1', padding:4,
                background: selected ? AC : hasData ? 'rgba(200,113,74,0.08)' : 'transparent',
                color: selected ? '#000' : hasData ? TXT : SEC,
                border:`1px solid ${selected ? AC : BRD}`, borderRadius:8,
                cursor: hasData ? 'pointer' : 'default',
                display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
                fontSize:13, fontWeight:500,
              }}>
              <div>{c.day}</div>
              {hasData && <div style={{ fontSize:9, opacity:.7, marginTop:2 }}>{(c.record.spend / 1000000).toFixed(1)}M</div>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ── PÁGINA: VISTA GENERAL ────────────────────────────────── */
function PageOverview() {
  const meta = useMetaData('overview', 'today')
  const [range, setRange] = useState('30')
  const [selectedDate, setSelectedDate] = useState(DAILY[DAILY.length - 1].date)
  const sliced = useMemo(() => {
    if (range === 'cal') return DAILY.filter(d => d.date === selectedDate)
    const n = parseInt(range, 10)
    return DAILY.slice(-n)
  }, [range, selectedDate])
  const agg = useMemo(() => {
    const sum = (k) => sliced.reduce((a, b) => a + b[k], 0)
    const spend = sum('spend'), impressions = sum('impressions'), clicks = sum('clicks')
    const purchases = sum('purchases'), revenue = sum('revenue')
    const addToCart = sum('addToCart'), checkout = sum('checkout')
    return {
      spend, impressions, clicks, purchases, revenue, addToCart, checkout,
      ctr: clicks && impressions ? +((clicks / impressions) * 100).toFixed(2) : 0,
      cpc: clicks ? Math.round(spend / clicks) : 0,
      cpa: purchases ? Math.round(spend / purchases) : 0,
      roas: spend ? +(revenue / spend).toFixed(2) : 0,
    }
  }, [sliced])
  const rangeLabel = range === 'cal' ? `Día ${selectedDate}` : range === '1' ? 'Hoy' : `Últimos ${range} días`
  return (
    <>
      <ConnStatus meta={meta} label="Vista General" datePreset="today" />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:20, borderBottom:`1px solid ${BRD}`, marginBottom:24 }}>
        <div style={{ fontSize:16, color:SEC }}>Vista General</div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ padding:'6px 14px', border:`1px solid ${AC}`, borderRadius:8, color:AC, fontSize:13 }}>Serrano Group</div>
          <RangeSelector value={range} onChange={setRange} />
        </div>
      </div>
      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Vista General</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>{rangeLabel} · {sliced.length} día(s) · {agg.purchases.toLocaleString()} compras</div>
      {range === 'cal' && (<div style={{ marginBottom:24 }}><Calendar data={DAILY} selectedDate={selectedDate} onSelect={setSelectedDate} /></div>)}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:16 }}>
        <KpiCard label="Inversión Total" value={fmtCOP(agg.spend)} sub="COP" delta={14.8} />
        <KpiCard label="Ingresos Estimados" value={fmtCOP(agg.revenue)} sub={`ROAS ${agg.roas}x × Gasto`} delta={20.9} />
        <KpiCard label="ROAS Combinado" value={`${agg.roas}x`} sub="omni_purchase" delta={5.3} />
        <KpiCard label="Compras" value={agg.purchases.toLocaleString()} sub="conversiones" delta={22.1} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="CPA" value={fmtMoney(agg.cpa)} sub="Costo por adquisición" delta={-6.2} />
        <KpiCard label="CTR Promedio" value={`${agg.ctr}%`} sub="sobre benchmark" delta={3.7} />
        <KpiCard label="CPC Promedio" value={fmtMoney(agg.cpc)} sub="COP por clic" delta={-3.8} />
        <KpiCard label="Impresiones" value={fmtNum(agg.impressions)} sub="totales" delta={11.3} />
      </div>
      {range !== 'cal' && sliced.length > 1 && (
        <Card style={{ marginBottom:24 }}>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>
            Gasto Diario (COP) &amp; ROAS — {rangeLabel} · Doble Eje Y
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={sliced}>
              <CartesianGrid stroke={BRD} vertical={false} />
              <XAxis dataKey="label" stroke={SEC} fontSize={11} />
              <YAxis yAxisId="left" stroke={SEC} fontSize={11} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
              <YAxis yAxisId="right" orientation="right" stroke={SEC} fontSize={11} tickFormatter={v => v + 'x'} />
              <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} />
              <Bar yAxisId="left" dataKey="spend" fill={AC} radius={[4,4,0,0]} name="Gasto" />
              <Line yAxisId="right" type="monotone" dataKey="roas" stroke={GR} strokeWidth={2} dot={false} name="ROAS" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {range !== 'cal' && sliced.length > 1 && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
          <Card>
            <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>CPA Diario (COP)</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={sliced}>
                <defs>
                  <linearGradient id="gcpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AC} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={AC} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={BRD} vertical={false} />
                <XAxis dataKey="label" stroke={SEC} fontSize={11} />
                <YAxis stroke={SEC} fontSize={11} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'K'} />
                <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={v => fmtMoney(v)} />
                <Area type="monotone" dataKey="cpa" stroke={AC} fill="url(#gcpa)" strokeWidth={2} name="CPA" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Embudo de Conversión</div>
            {[
              { k:'Impresiones', v:agg.impressions, c:AC },
              { k:'Clics',       v:agg.clicks,      c:ACL },
              { k:'Add to Cart', v:agg.addToCart,   c:AM },
              { k:'Checkout',    v:agg.checkout,    c:GR },
              { k:'Compras',     v:agg.purchases,   c:'#4ade80' },
            ].map((x, i, arr) => {
              const pct = (x.v / arr[0].v) * 100
              return (
                <div key={x.k} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13 }}>{x.k}</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>{fmtNum(x.v)}</span>
                  </div>
                  <div style={{ height:4, background:BRD, borderRadius:2 }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:x.c, borderRadius:2 }} />
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      )}
      {(range === 'cal' || range === '1') && sliced[0] && (
        <Card style={{ marginBottom:24 }}>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Detalle del {sliced[0].date}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
            <div><div style={{ color:SEC, fontSize:11 }}>CTR</div><div style={{ fontSize:22, fontWeight:700 }}>{sliced[0].ctr}%</div></div>
            <div><div style={{ color:SEC, fontSize:11 }}>CPC</div><div style={{ fontSize:22, fontWeight:700 }}>{fmtMoney(sliced[0].cpc)}</div></div>
            <div><div style={{ color:SEC, fontSize:11 }}>CPA</div><div style={{ fontSize:22, fontWeight:700, color:AC }}>{fmtMoney(sliced[0].cpa)}</div></div>
            <div><div style={{ color:SEC, fontSize:11 }}>ROAS</div><div style={{ fontSize:22, fontWeight:700, color:GR }}>{sliced[0].roas}x</div></div>
          </div>
        </Card>
      )}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:600 }}>Top Campañas por Gasto</div>
          <div style={{ color:AC, fontSize:13, cursor:'pointer' }}>Ver todas →</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ color:SEC, fontSize:11, textTransform:'uppercase' }}>
                <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Campaña</th>
                <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Estado</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Gasto</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Impres.</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Clics</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>CTR</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>CPA</th>
                <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map(c => (
                <tr key={c.id}>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}` }}>{c.name}</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}` }}>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6,
                      background: c.status === 'ACTIVE' ? 'rgba(74,222,128,0.15)' : 'rgba(140,140,140,0.15)',
                      color: c.status === 'ACTIVE' ? GR : SEC,
                    }}>• {c.status === 'ACTIVE' ? 'Activa' : 'Pausada'}</span>
                  </td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtCOP(c.spend)}</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtNum(c.impressions)}</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtNum(c.clicks)}</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{c.ctr}%</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right', color:AC, fontWeight:600 }}>{fmtMoney(c.cpa)}</td>
                  <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right', color:GR, fontWeight:600 }}>{c.roas}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ── PÁGINA: CAMPAÑAS ─────────────────────────────────────── */
function PageCampaigns() {
  const meta = useMetaData('campaigns', 'today')
  const total = CAMPAIGNS.reduce((s, c) => s + c.spend, 0)
  const activas = CAMPAIGNS.filter(c => c.status === 'ACTIVE').length
  return (
    <>
      <ConnStatus meta={meta} label="Campañas" datePreset="today" />

      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Campañas</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>Listado completo de campañas activas y pausadas</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Total Campañas" value={CAMPAIGNS.length.toString()} sub="en la cuenta" />
        <KpiCard label="Activas" value={activas.toString()} sub="corriendo ahora" />
        <KpiCard label="Gasto Total" value={fmtCOP(total)} sub="acumulado" />
        <KpiCard label="ROAS Promedio" value={(CAMPAIGNS.reduce((s,c)=>s+c.roas,0)/CAMPAIGNS.length).toFixed(2)+'x'} sub="todas las campañas" />
      </div>
      <Card>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Todas las campañas</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ color:SEC, fontSize:11, textTransform:'uppercase' }}>
              <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Campaña</th>
              <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Estado</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Presupuesto</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Gasto</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Compras</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>CPA</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map(c => (
              <tr key={c.id}>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}` }}>{c.name}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}` }}>
                  <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6,
                    background: c.status === 'ACTIVE' ? 'rgba(74,222,128,0.15)' : 'rgba(140,140,140,0.15)',
                    color: c.status === 'ACTIVE' ? GR : SEC,
                  }}>• {c.status === 'ACTIVE' ? 'Activa' : 'Pausada'}</span>
                </td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtMoney(c.budget)}/día</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtCOP(c.spend)}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{c.purchases}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right', color:AC, fontWeight:600 }}>{fmtMoney(c.cpa)}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right', color:GR, fontWeight:600 }}>{c.roas}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/* ── PÁGINA: ANALÍTICA ────────────────────────────────────── */
function PageAnalytics() {
  const meta = useMetaData('daily', 'today')
  const last30 = DAILY.slice(-30)
  return (
    <>
      <ConnStatus meta={meta} label="Analítica" datePreset="today" />

      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Analítica</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>Evolución de impresiones, clics y CTR en los últimos 30 días</div>
      <Card style={{ marginBottom:24 }}>
        <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Impresiones y clics diarios</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={last30}>
            <CartesianGrid stroke={BRD} vertical={false} />
            <XAxis dataKey="label" stroke={SEC} fontSize={11} />
            <YAxis stroke={SEC} fontSize={11} tickFormatter={v => fmtNum(v)} />
            <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} />
            <Legend />
            <Line type="monotone" dataKey="impressions" stroke={AC}  strokeWidth={2} dot={false} name="Impresiones" />
            <Line type="monotone" dataKey="clicks"      stroke={GR}  strokeWidth={2} dot={false} name="Clics" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>CTR diario (%)</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={last30}>
            <defs>
              <linearGradient id="gctr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GR} stopOpacity={0.4} />
                <stop offset="100%" stopColor={GR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={BRD} vertical={false} />
            <XAxis dataKey="label" stroke={SEC} fontSize={11} />
            <YAxis stroke={SEC} fontSize={11} tickFormatter={v => v + '%'} />
            <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} />
            <Area type="monotone" dataKey="ctr" stroke={GR} fill="url(#gctr)" strokeWidth={2} name="CTR" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </>
  )
}

/* ── PÁGINA: CREATIVIDADES (contenido real) ───────────────── */
function PageCreatives() {
  const meta = useMetaData('creatives', 'today')
  const [perf, setPerf] = useState('all')
  const [fmt, setFmt]   = useState('all')

  const formats = ['all', ...Array.from(new Set(CREATIVES.map(c => c.format)))]

  const filtered = CREATIVES.filter(c => {
    const okPerf = perf === 'all'
      || (perf === 'top' && c.roas > 5)
      || (perf === 'avg' && c.roas >= 2 && c.roas <= 5)
      || (perf === 'low' && c.roas < 2)
    const okFmt = fmt === 'all' || c.format === fmt
    return okPerf && okFmt
  })

  const totalSpend = CREATIVES.reduce((s, c) => s + c.spend, 0)
  const totalImpr  = CREATIVES.reduce((s, c) => s + c.impressions, 0)
  const avgCtr     = (CREATIVES.reduce((s, c) => s + c.ctr, 0) / CREATIVES.length).toFixed(2)
  const top = [...CREATIVES].sort((a,b) => b.roas - a.roas)[0]

  const perfBtns = [
    { k:'all', label:'Todos' },
    { k:'top', label:'🏆 Top (>5x)' },
    { k:'avg', label:'↗ Promedio (2–5x)' },
    { k:'low', label:'↘ Bajo (<2x)' },
  ]

  const perfColor = r => r > 5 ? GR : r >= 2 ? AM : RE
  const perfLabel = r => r > 5 ? '🏆 Top' : r >= 2 ? '↗ Promedio' : '↘ Bajo'

  return (
    <>
      <ConnStatus meta={meta} label="Creatividades" datePreset="today" />

      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Creatividades</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>Biblioteca de anuncios y rendimiento por creativo</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Total Creatividades" value={CREATIVES.length.toString()} sub="en rotación" />
        <KpiCard label="Gasto Total" value={fmtCOP(totalSpend)} sub="todos los creativos" />
        <KpiCard label="CTR Promedio" value={`${avgCtr}%`} sub="media general" delta={3.2} />
        <KpiCard label="Mejor ROAS" value={`${top.roas}x`} sub={top.name.split(' - ')[0]} />
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <select value={fmt} onChange={e => setFmt(e.target.value)}
          style={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8, padding:'8px 14px', color:TXT, fontSize:13, outline:'none', cursor:'pointer' }}>
          {formats.map(f => <option key={f} value={f}>{f === 'all' ? 'Todos los formatos' : f}</option>)}
        </select>
        {perfBtns.map(b => (
          <button key={b.k} onClick={() => setPerf(b.k)}
            style={{
              padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
              border: perf === b.k ? `1px solid ${AC}` : `1px solid ${BRD}`,
              background: perf === b.k ? 'rgba(200,113,74,0.12)' : CRD,
              color: perf === b.k ? AC : SEC,
            }}>{b.label}</button>
        ))}
      </div>

      {/* Grid de creatividades */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24 }}>
        {filtered.map(c => (
          <Card key={c.id} style={{ padding:0, overflow:'hidden' }}>
            <div style={{
              position:'relative', aspectRatio:'16/9', background:BRD,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:56
            }}>
              {c.emoji}
              <div style={{
                position:'absolute', top:10, right:10,
                padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                background:'rgba(0,0,0,0.6)', color:perfColor(c.roas),
                border:`1px solid ${perfColor(c.roas)}40`,
              }}>{perfLabel(c.roas)}</div>
              <div style={{
                position:'absolute', bottom:10, left:10,
                padding:'4px 10px', borderRadius:6, fontSize:11,
                background:'rgba(0,0,0,0.6)', color:TXT,
              }}>{c.format}</div>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{c.name}</div>
              <div style={{ fontSize:11, color:SEC, marginBottom:12 }}>{c.campaign}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:10, color:SEC, textTransform:'uppercase', letterSpacing:0.5 }}>Gasto</div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{fmtCOP(c.spend)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:SEC, textTransform:'uppercase', letterSpacing:0.5 }}>Impresiones</div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{fmtNum(c.impressions)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:SEC, textTransform:'uppercase', letterSpacing:0.5 }}>CTR</div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{c.ctr}%</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:SEC, textTransform:'uppercase', letterSpacing:0.5 }}>ROAS</div>
                  <div style={{ fontSize:15, fontWeight:700, color:perfColor(c.roas) }}>{c.roas}x</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ranking por ROAS */}
      <Card>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Ranking por ROAS</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[...CREATIVES].sort((a,b) => b.roas - a.roas)} layout="vertical" margin={{ left:20 }}>
            <CartesianGrid stroke={BRD} horizontal={false} />
            <XAxis type="number" stroke={SEC} fontSize={11} tickFormatter={v => v + 'x'} />
            <YAxis type="category" dataKey="name" stroke={SEC} fontSize={10} width={200} />
            <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={v => v + 'x'} />
            <Bar dataKey="roas" radius={[0,4,4,0]}>
              {CREATIVES.map((c, i) => <Cell key={i} fill={perfColor(c.roas)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  )
}

/* ── PÁGINA: AUDIENCIAS (contenido real) ──────────────────── */
function PageAudiences() {
  const meta = useMetaData('audiences_age_gender', 'today')
  const deviceColors = [AC, BL, PU]
  const roasColor = r => r > 4 ? GR : r >= 3 ? AM : RE
  const totalAudienceReach = AGE_GENDER.reduce((s, a) => s + a.male + a.female, 0)
  const topCountry = GEO[0]
  const topPlacement = [...PLACEMENTS].sort((a,b) => b.roas - a.roas)[0]

  return (
    <>
      <ConnStatus meta={meta} label="Audiencias" datePreset="today" />

      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Audiencias</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>Demografía, dispositivos, ubicaciones geográficas e intereses</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Alcance Total" value={fmtNum(totalAudienceReach)} sub="impresiones únicas" delta={11.3} />
        <KpiCard label="País Principal" value={`${topCountry.flag} ${topCountry.country}`} sub={`ROAS ${topCountry.roas}x`} />
        <KpiCard label="Mejor Placement" value={topPlacement.name} sub={`ROAS ${topPlacement.roas}x`} />
        <KpiCard label="Dispositivo Top" value="📱 Móvil" sub="68% del tráfico" />
      </div>

      {/* Edad + género y dispositivos */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
        <Card>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Distribución por edad y género</div>
          <div style={{ display:'flex', gap:16, fontSize:12, marginBottom:8 }}>
            <span style={{ color:AC }}>■ Masculino</span>
            <span style={{ color:BL }}>■ Femenino</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={AGE_GENDER}>
              <CartesianGrid stroke={BRD} vertical={false} />
              <XAxis dataKey="age" stroke={SEC} fontSize={11} />
              <YAxis stroke={SEC} fontSize={11} tickFormatter={v => fmtNum(v)} />
              <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={(v, n) => [fmtNum(v), n === 'male' ? 'Masculino' : 'Femenino']} />
              <Bar dataKey="male"   name="Masculino" fill={AC} radius={[4,4,0,0]} />
              <Bar dataKey="female" name="Femenino"  fill={BL} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Dispositivos</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={DEVICES} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {DEVICES.map((_, i) => <Cell key={i} fill={deviceColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={v => v + '%'} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
            {DEVICES.map((d, i) => (
              <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:10, height:10, background:deviceColors[i], borderRadius:2 }} />
                  {d.name}
                </span>
                <span style={{ fontWeight:600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ROAS por edad y placements */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <Card>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>ROAS por rango de edad</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={AGE_GENDER}>
              <CartesianGrid stroke={BRD} vertical={false} />
              <XAxis dataKey="age" stroke={SEC} fontSize={11} />
              <YAxis stroke={SEC} fontSize={11} tickFormatter={v => v + 'x'} />
              <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={v => v + 'x'} />
              <Bar dataKey="roas" radius={[4,4,0,0]}>
                {AGE_GENDER.map((a, i) => <Cell key={i} fill={roasColor(a.roas)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Placements por gasto</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PLACEMENTS} layout="vertical">
              <CartesianGrid stroke={BRD} horizontal={false} />
              <XAxis type="number" stroke={SEC} fontSize={11} tickFormatter={v => fmtCOP(v)} />
              <YAxis type="category" dataKey="name" stroke={SEC} fontSize={11} width={110} />
              <Tooltip contentStyle={{ background:CRD, border:`1px solid ${BRD}`, borderRadius:8 }} formatter={v => fmtCOP(v)} />
              <Bar dataKey="spend" fill={AC} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Geografía */}
      <Card style={{ marginBottom:24 }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Top ubicaciones geográficas</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ color:SEC, fontSize:11, textTransform:'uppercase' }}>
              <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>#</th>
              <th style={{ textAlign:'left',  padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>País</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Gasto</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Impresiones</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Clics</th>
              <th style={{ textAlign:'right', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {GEO.map((g, i) => (
              <tr key={g.country}>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, color:SEC }}>{i + 1}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}` }}>{g.flag} {g.country}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtCOP(g.spend)}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtNum(g.impressions)}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right' }}>{fmtNum(g.clicks)}</td>
                <td style={{ padding:'12px 8px', borderBottom:`1px solid ${BRD}`, textAlign:'right', color:roasColor(g.roas), fontWeight:600 }}>{g.roas}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Intereses */}
      <Card>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Intereses y afinidades</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
          {INTERESTS.map(it => (
            <div key={it.name} style={{ padding:14, border:`1px solid ${BRD}`, borderRadius:10, background:'rgba(200,113,74,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:600 }}>{it.name}</span>
                <span style={{ fontSize:12, color:GR, fontWeight:600 }}>{it.engagement}% eng.</span>
              </div>
              <div style={{ fontSize:12, color:SEC, marginBottom:8 }}>Audiencia potencial: {fmtNum(it.audience)}</div>
              <div style={{ height:5, background:BRD, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${(it.engagement / 7) * 100}%`, height:'100%', background:AC }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ── PÁGINA: PRESUPUESTO ──────────────────────────────────── */
function PageBudget() {
  const meta = useMetaData('campaigns', 'today')
  const total = CAMPAIGNS.reduce((s, c) => s + c.budget, 0)
  const spent = CAMPAIGNS.reduce((s, c) => s + c.spend, 0)
  return (
    <>
      <ConnStatus meta={meta} label="Presupuesto" datePreset="today" />

      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Presupuesto</h1>
      <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>Control de gasto por campaña</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Presupuesto Diario" value={fmtMoney(total)} sub="suma de todas las campañas" />
        <KpiCard label="Gastado (acumulado)" value={fmtCOP(spent)} sub="últimos 60 días" />
        <KpiCard label="Promedio diario gastado" value={fmtMoney(Math.round(spent/60))} sub="ritmo actual" />
      </div>
      <Card>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Presupuesto por campaña</div>
        {CAMPAIGNS.map(c => {
          const pct = Math.round((c.spend / (c.budget * 60)) * 100)
          return (
            <div key={c.id} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13 }}>{c.name}</span>
                <span style={{ fontSize:13, color:SEC }}>{fmtCOP(c.spend)} / {fmtMoney(c.budget)}·día</span>
              </div>
              <div style={{ height:6, background:BRD, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${Math.min(pct, 100)}%`, height:'100%', background: pct > 100 ? RE : pct > 80 ? AM : GR }} />
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}

/* ── APP (navegación funcional) ───────────────────────────── */
export default function App() {
  const [section, setSection] = useState('overview')
  const menu = [
    { id:'overview',   label:'Vista General' },
    { id:'campaigns',  label:'Campañas' },
    { id:'analytics',  label:'Analítica' },
    { id:'creatives',  label:'Creatividades' },
    { id:'audiences',  label:'Audiencias' },
    { id:'budget',     label:'Presupuesto' },
  ]
  const renderSection = () => {
    switch (section) {
      case 'overview':   return <PageOverview />
      case 'campaigns':  return <PageCampaigns />
      case 'analytics':  return <PageAnalytics />
      case 'creatives':  return <PageCreatives />
      case 'audiences':  return <PageAudiences />
      case 'budget':     return <PageBudget />
      default:           return <PageOverview />
    }
  }
  return (
    <div style={{ background:BG, color:TXT, minHeight:'100vh', display:'flex', fontFamily:'-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      <aside style={{ width:220, background:CRD, borderRight:`1px solid ${BRD}`, padding:'24px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, padding:'0 8px' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:AC }} />
          <div style={{ fontWeight:700, fontSize:15 }}>Meta Ads</div>
        </div>
        {menu.map(m => {
          const active = section === m.id
          return (
            <div key={m.id}
              onClick={() => setSection(m.id)}
              style={{
                padding:'10px 12px', borderRadius:8, marginBottom:4,
                color: active ? AC : SEC, fontSize:14,
                background: active ? 'rgba(200,113,74,0.1)' : 'transparent',
                cursor:'pointer', transition:'all .15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = TXT }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = SEC }}
            >{m.label}</div>
          )
        })}
        <div style={{ marginTop:32, padding:'0 8px', color:SEC, fontSize:11 }}>act. SERRANO_GROUP</div>
      </aside>
      <main style={{ flex:1, padding:'24px 32px', overflow:'auto' }}>
        {renderSection()}
      </main>
    </div>
  )
}
