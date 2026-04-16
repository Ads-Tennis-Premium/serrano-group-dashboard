import React, { useState, useEffect } from 'react'

// Hook: trae datos reales desde /api/meta-insights
export function useMetaData(endpoint, datePreset = 'today') {
  const [state, setState] = useState({
    loading: true, ok: false, configured: false, data: null, error: null, ts: null
  })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setState(s => ({ ...s, loading: true }))
    fetch(`/api/meta-insights?endpoint=${endpoint}&date_preset=${datePreset}`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return
        setState({
          loading: false,
          ok: !!j.ok,
          configured: !!j.configured,
          data: j,
          error: j.ok ? null : (j.message || 'Error desconocido'),
          ts: Date.now()
        })
      })
      .catch(err => {
        if (!alive) return
        setState({ loading: false, ok: false, configured: false, data: null, error: err.message, ts: Date.now() })
      })
    return () => { alive = false }
  }, [endpoint, datePreset, tick])
  return { ...state, refresh: () => setTick(t => t + 1) }
}

// Banner de estado de conexión a Meta
export function ConnStatus({ meta, label = 'Meta API', datePreset }) {
  const base = {
    padding: '12px 16px', borderRadius: 10, marginBottom: 18,
    fontSize: 13, lineHeight: 1.5, border: '1px solid'
  }
  if (meta.loading) {
    return (
      <div style={{ ...base, background: '#0f172a', borderColor: '#1e293b', color: '#94a3b8' }}>
        ⏳ Cargando datos reales de Meta ({label}{datePreset ? ' · ' + datePreset : ''})...
      </div>
    )
  }
  if (!meta.configured) {
    return (
      <div style={{ ...base, background: '#2a1414', borderColor: '#7f1d1d', color: '#fca5a5' }}>
        🔴 <b>Mostrando datos de demostración.</b> Para ver datos 100% reales de tus campañas de hoy, configura
        <code style={{background:'#111',padding:'2px 6px',margin:'0 4px',borderRadius:4,color:'#fbbf24'}}>META_ACCESS_TOKEN</code>
        y
        <code style={{background:'#111',padding:'2px 6px',margin:'0 4px',borderRadius:4,color:'#fbbf24'}}>META_AD_ACCOUNT_ID</code>
        en Vercel → Settings → Environment Variables, y vuelve a desplegar.
      </div>
    )
  }
  if (!meta.ok) {
    return (
      <div style={{ ...base, background: '#2a1f0e', borderColor: '#78350f', color: '#fcd34d' }}>
        ⚠️ Error consultando Meta API: {meta.error || 'sin detalle'}.
        <button onClick={meta.refresh} style={{ marginLeft: 10, background:'#78350f', color:'#fde68a', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>Reintentar</button>
      </div>
    )
  }
  return (
    <div style={{ ...base, background: '#0f2a1a', borderColor: '#14532d', color: '#86efac' }}>
      🟢 <b>Datos reales de Meta conectados</b> ({label}{datePreset ? ' · ' + datePreset : ''}) — actualizado {new Date(meta.ts).toLocaleTimeString()}
      <button onClick={meta.refresh} style={{ marginLeft: 10, background:'#14532d', color:'#bbf7d0', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>Refrescar</button>
    </div>
  )
}

// Helpers
export const fmtMoney = (n, cur = 'USD') => n == null || isNaN(Number(n)) ? '—' : new Intl.NumberFormat('es-MX', {style:'currency', currency: cur, maximumFractionDigits: 2}).format(Number(n))
export const fmtNum   = n => n == null || isNaN(Number(n)) ? '—' : Number(n).toLocaleString('es-MX')
export const fmtPct   = n => n == null || isNaN(Number(n)) ? '—' : Number(n).toFixed(2) + '%'
export const fmtX     = n => n == null || isNaN(Number(n)) ? '—' : Number(n).toFixed(2) + 'x'
export const findAction = (actions, type) => {
  if (!Array.isArray(actions)) return 0
  const a = actions.find(x => x.action_type === type)
  return a ? Number(a.value) : 0
}
export const bestRoas = roasArr => {
  if (!Array.isArray(roasArr) || !roasArr.length) return null
  return Math.max(...roasArr.map(r => Number(r.value)))
}
