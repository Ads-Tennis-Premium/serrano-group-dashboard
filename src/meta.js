import React, { useState, useEffect } from 'react'

// Hook: trae datos reales desde /api/meta-insights
export function useMetaData(endpoint, datePreset) {
  const pr = datePreset || 'today'
  const [state, setState] = useState({
    loading: true, ok: false, configured: false, data: null, error: null, ts: null
  })
  const [tick, setTick] = useState(0)
  useEffect(function () {
    let alive = true
    setState(function (s) { return Object.assign({}, s, { loading: true }) })
    fetch('/api/meta-insights?endpoint=' + encodeURIComponent(endpoint) + '&date_preset=' + encodeURIComponent(pr))
      .then(function (r) { return r.json() })
      .then(function (j) {
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
      .catch(function (err) {
        if (!alive) return
        setState({ loading: false, ok: false, configured: false, data: null, error: err.message, ts: Date.now() })
      })
    return function () { alive = false }
  }, [endpoint, pr, tick])
  return Object.assign({}, state, { refresh: function () { setTick(function (t) { return t + 1 }) } })
}

// Banner de estado de conexión a Meta
export function ConnStatus(props) {
  const meta = props.meta
  const label = props.label || 'Meta API'
  const datePreset = props.datePreset || ''
  const suffix = datePreset ? ' - ' + datePreset : ''

  const base = {
    padding: '12px 16px', borderRadius: 10, marginBottom: 18,
    fontSize: 13, lineHeight: 1.5, border: '1px solid'
  }

  if (meta.loading) {
    const st = Object.assign({}, base, { background: '#0f172a', borderColor: '#1e293b', color: '#94a3b8' })
    return React.createElement('div', { style: st }, 'Cargando datos reales de Meta - ' + label + suffix + '...')
  }

  if (!meta.configured) {
    const st = Object.assign({}, base, { background: '#2a1414', borderColor: '#7f1d1d', color: '#fca5a5' })
    return React.createElement('div', { style: st },
      React.createElement('b', null, 'Mostrando datos de demostracion. '),
      'Para ver datos 100% reales de tus campanas de hoy, configura ',
      React.createElement('code', { style: { background: '#111', padding: '2px 6px', margin: '0 4px', borderRadius: 4, color: '#fbbf24' } }, 'META_ACCESS_TOKEN'),
      ' y ',
      React.createElement('code', { style: { background: '#111', padding: '2px 6px', margin: '0 4px', borderRadius: 4, color: '#fbbf24' } }, 'META_AD_ACCOUNT_ID'),
      ' en Vercel -> Settings -> Environment Variables, y vuelve a desplegar.'
    )
  }

  if (!meta.ok) {
    const st = Object.assign({}, base, { background: '#2a1f0e', borderColor: '#78350f', color: '#fcd34d' })
    return React.createElement('div', { style: st },
      'Error consultando Meta API: ' + (meta.error || 'sin detalle') + '. ',
      React.createElement('button', {
        onClick: meta.refresh,
        style: { marginLeft: 10, background: '#78350f', color: '#fde68a', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }
      }, 'Reintentar')
    )
  }

  const st = Object.assign({}, base, { background: '#0f2a1a', borderColor: '#14532d', color: '#86efac' })
  return React.createElement('div', { style: st },
    React.createElement('b', null, 'Datos reales de Meta conectados. '),
    label + suffix + ' - actualizado ' + new Date(meta.ts).toLocaleTimeString() + ' ',
    React.createElement('button', {
      onClick: meta.refresh,
      style: { marginLeft: 10, background: '#14532d', color: '#bbf7d0', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }
    }, 'Refrescar')
  )
}
