import React, { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts'

/* ── COLORES ──────────────────────────────────────────────── */
const AC  = '#C8714A'
const ACL = '#e8916a'
const GR  = '#4ADE80'
const AM  = '#fbbf24'
const RE  = '#f87171'
const BG  = '#0d0d0d'
const CRD = '#161616'
const BRD = '#282828'
const TXT = '#FFFFFF'
const SEC = '#8C8C8C'

/* ── DATOS DIARIOS (60 días para cubrir rangos) ───────────── */
function generateDailyData() {
  const data = []
  const today = new Date()
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const base = 2000000 + Math.sin(i / 3) * 400000 + Math.random() * 500000
    const spend = Math.round(base)
    const impressions = Math.round(spend * (90 + Math.random() * 20))
    const clicks = Math.round(impressions * (0.028 + Math.random() * 0.012))
    const purchases = Math.round(clicks * (0.04 + Math.random() * 0.02))
    const revenue = Math.round(spend * (3.8 + Math.random() * 1.4))
    const addToCart = Math.round(clicks * (0.22 + Math.random() * 0.08))
    const checkout = Math.round(addToCart * (0.42 + Math.random() * 0.1))
    data.push({
      date: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      spend,
      impressions,
      clicks,
      purchases,
      revenue,
      addToCart,
      checkout,
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
  { id:1, name:'Prospecting - Raquetas Premium',   status:'ACTIVE', budget:650000, spend:18500000, impressions:1820000, clicks:58000, purchases:310, ctr:3.19, cpc:319, cpa:59677,  roas:5.2 },
  { id:2, name:'Retargeting - Carrito Abandonado', status:'ACTIVE', budget:450000, spend:12300000, impressions:980000,  clicks:38500, purchases:285, ctr:3.93, cpc:319, cpa:43158,  roas:6.8 },
  { id:3, name:'Lookalike - Compradores',          status:'ACTIVE', budget:350000, spend:9800000,  impressions:1100000, clicks:32000, purchases:170, ctr:2.91, cpc:306, cpa:57647,  roas:4.5 },
  { id:4, name:'Conversión - Zapatillas',          status:'ACTIVE', budget:320000, spend:8900000,  impressions:780000,  clicks:28000, purchases:165, ctr:3.59, cpc:318, cpa:53939,  roas:4.9 },
  { id:5, name:'Brand Awareness - Tenis',          status:'ACTIVE', budget:280000, spend:7600000,  impressions:2100000, clicks:39000, purchases:85,  ctr:1.86, cpc:195, cpa:89412,  roas:2.4 },
  { id:6, name:'Video Ads - Tutoriales',           status:'PAUSED', budget:180000, spend:4200000,  impressions:890000,  clicks:19100, purchases:52,  ctr:2.15, cpc:220, cpa:80769,  roas:2.8 },
]

/* ── HELPERS ──────────────────────────────────────────────── */
const fmtCOP  = n => '$' + (n / 1000000).toFixed(1) + 'M'
const fmtNum  = n => n >= 1000000 ? (n / 1000000).toFixed(2) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString()
const fmtMoney= n => '$' + Math.round(n).toLocaleString('es-CO')

/* ── COMPONENTES ──────────────────────────────────────────── */
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
    { k:'1',  label:'Hoy' },
    { k:'7',  label:'7 días' },
    { k:'15', label:'15 días' },
    { k:'30', label:'30 días' },
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

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

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
            <button key={i}
              onClick={() => hasData && onSelect(c.iso)}
              disabled={!hasData}
              style={{
                aspectRatio:'1', padding:4,
                background: selected ? AC : hasData ? 'rgba(200,113,74,0.08)' : 'transparent',
                color: selected ? '#000' : hasData ? TXT : SEC,
                border:`1px solid ${selected ? AC : BRD}`,
                borderRadius:8, cursor: hasData ? 'pointer' : 'default',
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

/* ── APP ──────────────────────────────────────────────────── */
export default function App() {
  const [range, setRange] = useState('30')
  const [selectedDate, setSelectedDate] = useState(DAILY[DAILY.length - 1].date)

  const sliced = useMemo(() => {
    if (range === 'cal') {
      return DAILY.filter(d => d.date === selectedDate)
    }
    const n = parseInt(range, 10)
    return DAILY.slice(-n)
  }, [range, selectedDate])

  const agg = useMemo(() => {
    const sum = (k) => sliced.reduce((a, b) => a + b[k], 0)
    const spend = sum('spend')
    const impressions = sum('impressions')
    const clicks = sum('clicks')
    const purchases = sum('purchases')
    const revenue = sum('revenue')
    const addToCart = sum('addToCart')
    const checkout = sum('checkout')
    return {
      spend, impressions, clicks, purchases, revenue, addToCart, checkout,
      ctr: clicks && impressions ? +((clicks / impressions) * 100).toFixed(2) : 0,
      cpc: clicks ? Math.round(spend / clicks) : 0,
      cpa: purchases ? Math.round(spend / purchases) : 0,
      roas: spend ? +(revenue / spend).toFixed(2) : 0,
    }
  }, [sliced])

  const rangeLabel = range === 'cal'
    ? `Día ${selectedDate}`
    : range === '1' ? 'Hoy' : `Últimos ${range} días`

  return (
    <div style={{ background:BG, color:TXT, minHeight:'100vh', display:'flex', fontFamily:'-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width:220, background:CRD, borderRight:`1px solid ${BRD}`, padding:'24px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, padding:'0 8px' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:AC }} />
          <div style={{ fontWeight:700, fontSize:15 }}>Meta Ads</div>
        </div>
        {['Vista General','Campañas','Analítica','Creatividades','Audiencias','Presupuesto'].map((m, i) => (
          <div key={m} style={{
            padding:'10px 12px', borderRadius:8, marginBottom:4,
            color: i === 0 ? AC : SEC, fontSize:14,
            background: i === 0 ? 'rgba(200,113,74,0.1)' : 'transparent',
            cursor:'pointer',
          }}>{m}</div>
        ))}
        <div style={{ marginTop:32, padding:'0 8px', color:SEC, fontSize:11 }}>act. SERRANO_GROUP</div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, padding:'24px 32px', overflow:'auto' }}>
        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:20, borderBottom:`1px solid ${BRD}`, marginBottom:24 }}>
          <div style={{ fontSize:16, color:SEC }}>Vista General</div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ padding:'6px 14px', border:`1px solid ${AC}`, borderRadius:8, color:AC, fontSize:13 }}>Serrano Group</div>
            <RangeSelector value={range} onChange={setRange} />
          </div>
        </div>

        <h1 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Vista General</h1>
        <div style={{ color:SEC, fontSize:14, marginBottom:24 }}>{rangeLabel} · {sliced.length} día(s) · {agg.purchases} compras</div>

        {/* CALENDARIO (solo si está seleccionado) */}
        {range === 'cal' && (
          <div style={{ marginBottom:24 }}>
            <Calendar data={DAILY} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>
        )}

        {/* KPIs */}
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

        {/* GRÁFICO PRINCIPAL - Gasto + ROAS */}
        {range !== 'cal' && (
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

        {/* CPA + CTR DIARIO */}
        {range !== 'cal' && (
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
            <Card>
              <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>CPA Diario (COP)</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={sliced}>
                  <defs>
                    <linearGradient id="gcpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={AC} stopOpacity={0.4} />
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
                { k:'Clics', v:agg.clicks, c:ACL },
                { k:'Add to Cart', v:agg.addToCart, c:AM },
                { k:'Checkout', v:agg.checkout, c:GR },
                { k:'Compras', v:agg.purchases, c:'#4ade80' },
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

        {/* DETALLE DEL DÍA (solo en calendario) */}
        {range === 'cal' && sliced[0] && (
          <Card style={{ marginBottom:24 }}>
            <div style={{ color:SEC, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>
              Detalle del {selectedDate}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
              <div><div style={{ color:SEC, fontSize:11 }}>CTR</div><div style={{ fontSize:22, fontWeight:700 }}>{sliced[0].ctr}%</div></div>
              <div><div style={{ color:SEC, fontSize:11 }}>CPC</div><div style={{ fontSize:22, fontWeight:700 }}>{fmtMoney(sliced[0].cpc)}</div></div>
              <div><div style={{ color:SEC, fontSize:11 }}>CPA</div><div style={{ fontSize:22, fontWeight:700, color:AC }}>{fmtMoney(sliced[0].cpa)}</div></div>
              <div><div style={{ color:SEC, fontSize:11 }}>ROAS</div><div style={{ fontSize:22, fontWeight:700, color:GR }}>{sliced[0].roas}x</div></div>
            </div>
          </Card>
        )}

        {/* CAMPAÑAS TABLE */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:600 }}>Top Campañas por Gasto</div>
            <div style={{ color:AC, fontSize:13, cursor:'pointer' }}>Ver todas →</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:SEC, fontSize:11, textTransform:'uppercase' }}>
                  <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Campaña</th>
                  <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${BRD}` }}>Estado</th>
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
                      <span style={{
                        fontSize:11, padding:'3px 8px', borderRadius:6,
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
      </main>
    </div>
  )
}
