import { useState, useEffect, Fragment } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import api from '../services/api'
import './Reportes.css'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const PIE_COLORS = ['#2563EB','#059669','#D97706','#7C3AED','#DB2777','#0D9488','#DC2626','#475569','#EA580C']

const CARGO_LABEL = { PRESIDENTE: 'Presidente', SECRETARIO: 'Secretario', TESORERO: 'Tesorero' }

const TABLA_LABEL = {
  gastos: 'Gastos',
  usuarios: 'Usuarios',
  usuarios_roles: 'Roles',
  usuarios_permisos: 'Permisos',
  propietarios_departamentos: 'Propietarios',
  inquilinos_departamentos: 'Inquilinos',
  cocheras_departamentos: 'Cocheras',
  configuracion_mantenimiento: 'Config. mantenimiento',
}
const tablaLabel = (t) => TABLA_LABEL[t] || t

const formatearFechaHora = (iso) => {
  if (!iso) return '—'
  const f = new Date(iso)
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

const parseJson = (s) => { try { return s ? JSON.parse(s) : null } catch { return null } }

// ── Íconos ──────────────────────────────────────────────────────
const IcoDownload = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IcoChev     = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoCash     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
const IcoBank     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoBarChart = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoCalendar = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoClipboard= () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
const IcoActivity = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: S/ {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

export default function Reportes() {
  const ahora = new Date()
  const [tab,         setTab]         = useState('mensual')
  const [mes,         setMes]         = useState(ahora.getMonth() + 1)
  const [anio,        setAnio]        = useState(ahora.getFullYear())
  const [reporteMes,  setReporteMes]  = useState(null)
  const [reporteAnio, setReporteAnio] = useState(null)
  const [auditoria,   setAuditoria]   = useState([])
  const [filtroAuditoria, setFiltroAuditoria] = useState('TODOS')
  const [auditoriaGeneral, setAuditoriaGeneral] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [separarCaja, setSepararCaja] = useState(false)

  // Auditoría general — filtros
  const [agBusqueda, setAgBusqueda] = useState('')
  const [agUsuario,  setAgUsuario]  = useState('')
  const [agTabla,    setAgTabla]    = useState('')
  const [agExpandId, setAgExpandId] = useState(null)

  useEffect(() => { cargarDatos() }, [tab, mes, anio])

  const cargarDatos = async () => {
    setLoading(true); setError('')
    try {
      if (tab === 'mensual') {
        const r = await api.get('/api/reportes/mes/' + anio + '/' + mes)
        setReporteMes(r.data)
      } else if (tab === 'anual') {
        const r = await api.get('/api/reportes/anio/' + anio)
        setReporteAnio(r.data)
      } else if (tab === 'auditoria') {
        const r = await api.get('/api/reportes/auditoria', { params: { mes, anio } })
        setAuditoria(r.data)
      } else if (tab === 'auditoria-general') {
        const r = await api.get('/api/reportes/auditoria-sistema')
        setAuditoriaGeneral(r.data)
      }
    } catch (e) {
      setError(e.response?.data || 'Error al cargar reportes')
    } finally { setLoading(false) }
  }

  const exportarMensual = () => {
    if (!reporteMes) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['REPORTE MENSUAL - TORRE BLANCA'],
      ['Período: ' + MESES[mes-1] + ' ' + anio],
      [],
      ['Concepto', 'Monto (S/)'],
      ['Total esperado',  reporteMes.totalEsperado],
      ['Total recaudado', reporteMes.totalRecaudado],
      ['  · Efectivo',    reporteMes.recaudadoEfectivo],
      ['  · Digital',     reporteMes.recaudadoDigital],
      ['Total gastos',    reporteMes.totalGastos],
      ['Balance',         reporteMes.balance],
      [],
      ['Deptos pagados', reporteMes.deptosPagados + ' / ' + reporteMes.deptosTotal],
    ]), 'Resumen')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['DEPARTAMENTOS DEUDORES'],
      [],
      ['Departamento','Piso','Monto pendiente','Residente(s)'],
      ...(reporteMes.deudores||[]).map(d => [d.numeroDepartamento, d.piso, Number(d.montoPendiente).toFixed(2), d.residentesNombres])
    ]), 'Deudores')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['GASTOS POR CATEGORÍA'],
      [],
      ['Categoría','Total (S/)'],
      ...Object.entries(reporteMes.gastosPorCategoria||{}).map(([k,v]) => [k, Number(v).toFixed(2)])
    ]), 'Gastos')

    XLSX.writeFile(wb, 'Reporte_TorreBlanca_' + MESES[mes-1] + '_' + anio + '.xlsx')
  }

  const exportarAnual = () => {
    if (!reporteAnio) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['REPORTE ANUAL - TORRE BLANCA'],
      ['Año: ' + anio],
      [],
      ['Total recaudado año', reporteAnio.totalRecaudadoAnio],
      ['Total gastos año',    reporteAnio.totalGastosAnio],
      ['Balance año',         reporteAnio.balanceAnio],
      [],
      ['Mes','Recaudado (S/)','Efectivo (S/)','Digital (S/)','Gastos (S/)','Balance (S/)','Deptos pagados','Total deptos'],
      ...(reporteAnio.datosMensuales||[]).map(d => [d.mes, Number(d.recaudado).toFixed(2), Number(d.recaudadoEfectivo||0).toFixed(2), Number(d.recaudadoDigital||0).toFixed(2), Number(d.gastos).toFixed(2), Number(d.balance).toFixed(2), d.pagados, d.total])
    ]), 'Resumen anual')
    XLSX.writeFile(wb, 'Reporte_TorreBlanca_' + anio + '.xlsx')
  }

  const pieData = reporteMes ? Object.entries(reporteMes.gastosPorCategoria||{}).map(([name,value]) => ({ name, value: Number(value) })) : []

  // ── Auditoría general: listas para filtros + filtrado ──────────
  const agUsuarios = [...new Set(auditoriaGeneral.map(a => a.usuarioNombre).filter(Boolean))].sort()
  const agTablas    = [...new Set(auditoriaGeneral.map(a => a.tablaAfectada).filter(Boolean))].sort()
  const auditoriaGeneralFiltrada = auditoriaGeneral.filter(a => {
    if (agUsuario && a.usuarioNombre !== agUsuario) return false
    if (agTabla   && a.tablaAfectada !== agTabla)   return false
    if (agBusqueda && !`${a.accion} ${a.usuarioNombre || ''}`.toLowerCase().includes(agBusqueda.toLowerCase())) return false
    return true
  })

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <h1 className="rep-page-titulo">Reportes</h1>
          <p className="rep-page-sub">Análisis financiero y actividad administrativa de Torre Blanca</p>
        </div>
        {(tab === 'mensual' || tab === 'anual') && (
          <button className="btn btn-export" onClick={tab==='mensual' ? exportarMensual : exportarAnual} disabled={loading}>
            <IcoDownload /> Exportar Excel
          </button>
        )}
      </div>

      <div className="rep-tabs">
        <button className={`rep-tab ${tab==='mensual'?'rep-tab-active':''}`} onClick={() => setTab('mensual')}><IcoBarChart /> Reporte mensual</button>
        <button className={`rep-tab ${tab==='anual'?'rep-tab-active':''}`} onClick={() => setTab('anual')}><IcoCalendar /> Reporte anual</button>
        <button className={`rep-tab ${tab==='auditoria'?'rep-tab-active':''}`} onClick={() => setTab('auditoria')}><IcoClipboard /> Auditoría de pagos</button>
        <button className={`rep-tab ${tab==='auditoria-general'?'rep-tab-active':''}`} onClick={() => setTab('auditoria-general')}><IcoActivity /> Auditoría general</button>
      </div>

      <div className="rep-controls-row">
        {(tab === 'mensual' || tab === 'auditoria') && (
          <div className="mes-selector">
            <select className="mes-select" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
        {tab === 'anual' && (
          <div className="mes-selector">
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}

        {(tab === 'mensual' || tab === 'anual') && (
          <label className="rep-toggle">
            <input type="checkbox" checked={separarCaja} onChange={e => setSepararCaja(e.target.checked)} />
            <span className="rep-toggle-track"><span className="rep-toggle-thumb" /></span>
            Separar caja: Efectivo / Digital
          </label>
        )}
      </div>

      {loading && <div className="loading-msg">Cargando reporte...</div>}
      {error   && <div className="alert-error">{error}</div>}

      {tab === 'mensual' && reporteMes && !loading && (
        <div>
          <div className="rep-stats">
            <div className="rep-stat rc-blue"><p className="rep-stat-label">Total esperado</p><p className="rep-stat-valor">S/ {Number(reporteMes.totalEsperado).toFixed(2)}</p></div>

            {separarCaja ? (
              <>
                <div className="rep-stat rc-green"><p className="rep-stat-label"><IcoCash /> Efectivo</p><p className="rep-stat-valor">S/ {Number(reporteMes.recaudadoEfectivo||0).toFixed(2)}</p></div>
                <div className="rep-stat rc-indigo"><p className="rep-stat-label"><IcoBank /> Digital</p><p className="rep-stat-valor">S/ {Number(reporteMes.recaudadoDigital||0).toFixed(2)}</p></div>
              </>
            ) : (
              <div className="rep-stat rc-green"><p className="rep-stat-label">Recaudado</p><p className="rep-stat-valor">S/ {Number(reporteMes.totalRecaudado).toFixed(2)}</p></div>
            )}

            <div className="rep-stat rc-orange"><p className="rep-stat-label">Gastos</p><p className="rep-stat-valor">S/ {Number(reporteMes.totalGastos).toFixed(2)}</p></div>
            <div className={'rep-stat ' + (Number(reporteMes.balance)>=0?'rc-green':'rc-red')}><p className="rep-stat-label">Balance</p><p className="rep-stat-valor">S/ {Number(reporteMes.balance).toFixed(2)}</p></div>
            <div className="rep-stat rc-neutral"><p className="rep-stat-label">Deptos pagados</p><p className="rep-stat-valor">{reporteMes.deptosPagados} / {reporteMes.deptosTotal}</p></div>
          </div>

          <div className="charts-row">
            {pieData.length > 0 && (
              <div className="chart-card">
                <h3 className="chart-title">Gastos por categoría</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
                      {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => 'S/ ' + Number(v).toFixed(2)} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="chart-card">
              <h3 className="chart-title">Resumen financiero</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={separarCaja
                    ? [{ name: MESES[mes-1], Efectivo: Number(reporteMes.recaudadoEfectivo||0), Digital: Number(reporteMes.recaudadoDigital||0), Gastos: Number(reporteMes.totalGastos) }]
                    : [{ name: MESES[mes-1], Recaudado: Number(reporteMes.totalRecaudado), Gastos: Number(reporteMes.totalGastos) }]
                  }
                  margin={{top:10,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fontSize:12}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/ '+v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {separarCaja ? (
                    <>
                      <Bar dataKey="Efectivo" fill="#059669" radius={[4,4,0,0]} />
                      <Bar dataKey="Digital"  fill="#2563EB" radius={[4,4,0,0]} />
                      <Bar dataKey="Gastos"   fill="#D97706" radius={[4,4,0,0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Recaudado" fill="#2563EB" radius={[4,4,0,0]} />
                      <Bar dataKey="Gastos"    fill="#D97706" radius={[4,4,0,0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {reporteMes.deudores?.length > 0 && (
            <div className="deudores-section">
              <h3 className="chart-title">Departamentos pendientes ({reporteMes.deudores.length})</h3>
              <div className="deudores-tabla">
                <div className="tabla-header"><span>Depto</span><span>Piso</span><span>Residente(s)</span><span>Monto</span></div>
                {reporteMes.deudores.map((d,i) => (
                  <div key={i} className="tabla-row">
                    <span className="depto-num">{d.numeroDepartamento}</span>
                    <span>Piso {d.piso}</span>
                    <span className="deudor-nombre">{d.residentesNombres}</span>
                    <span className="deudor-monto">S/ {Number(d.montoPendiente).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'anual' && reporteAnio && !loading && (
        <div>
          <div className="rep-stats">
            <div className="rep-stat rc-blue"><p className="rep-stat-label">Recaudado {anio}</p><p className="rep-stat-valor">S/ {Number(reporteAnio.totalRecaudadoAnio).toFixed(2)}</p></div>
            <div className="rep-stat rc-orange"><p className="rep-stat-label">Gastos {anio}</p><p className="rep-stat-valor">S/ {Number(reporteAnio.totalGastosAnio).toFixed(2)}</p></div>
            <div className={'rep-stat ' + (Number(reporteAnio.balanceAnio)>=0?'rc-green':'rc-red')}><p className="rep-stat-label">Balance {anio}</p><p className="rep-stat-valor">S/ {Number(reporteAnio.balanceAnio).toFixed(2)}</p></div>
          </div>

          <div className="chart-card chart-full">
            <h3 className="chart-title">{separarCaja ? 'Efectivo vs Digital vs Gastos por mes' : 'Recaudado vs Gastos por mes'} — {anio}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {separarCaja ? (
                  <>
                    <Bar dataKey="recaudadoEfectivo" name="Efectivo" fill="#059669" radius={[3,3,0,0]} />
                    <Bar dataKey="recaudadoDigital"  name="Digital"  fill="#2563EB" radius={[3,3,0,0]} />
                    <Bar dataKey="gastos"            name="Gastos"  fill="#D97706" radius={[3,3,0,0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="recaudado" name="Recaudado" fill="#2563EB" radius={[3,3,0,0]} />
                    <Bar dataKey="gastos"    name="Gastos"    fill="#D97706" radius={[3,3,0,0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card chart-full">
            <h3 className="chart-title">Tendencia de balance — {anio}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#059669" strokeWidth={2.5} dot={{r:4,fill:'#059669'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'auditoria' && !loading && (
        <div>
          <div className="audit-filtros">
            {['TODOS','PENDIENTE_VERIFICACION','VERIFICADO','RECHAZADO'].map(f => (
              <button key={f}
                className={'audit-filtro-btn ' + (filtroAuditoria === f ? 'audit-filtro-active' : '')}
                onClick={() => setFiltroAuditoria(f)}
              >
                {f === 'TODOS' ? 'Todos' : f === 'PENDIENTE_VERIFICACION' ? 'Pendientes' : f === 'VERIFICADO' ? 'Verificados' : 'Rechazados'}
              </button>
            ))}
          </div>

          {auditoria.length === 0 && (
            <div className="empty-state">No hay movimientos de pago registrados en {MESES[mes-1]} {anio}.</div>
          )}

          <div className="audit-lista">
            {auditoria
              .filter(a => filtroAuditoria === 'TODOS' || a.estado === filtroAuditoria)
              .map(a => (
                <div key={a.pagoId} className="audit-card">

                  <div className="audit-card-top">
                    <div className="audit-depto">
                      <span className="audit-depto-num">Depto {a.numeroDepartamento}</span>
                      <span className="audit-depto-piso">Piso {a.piso} · {MESES[a.mes-1]} {a.anio}</span>
                    </div>
                    <div className="audit-monto-wrap">
                      <span className="audit-monto">S/ {Number(a.monto).toFixed(2)}</span>
                      <span className={'pg-badge ' + (a.estado === 'VERIFICADO' ? 'badge-ok' : a.estado === 'RECHAZADO' ? 'badge-err' : 'badge-warn')}>
                        {a.estado === 'VERIFICADO' ? 'Verificado' : a.estado === 'RECHAZADO' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="audit-timeline">

                    <div className="audit-evento">
                      <div className="audit-evento-dot audit-dot-registro" />
                      <div className="audit-evento-body">
                        <p className="audit-evento-titulo">
                          Pago registrado — {a.metodoPago}{a.esPasarela ? ' (pasarela Mercado Pago)' : ''}
                        </p>
                        <p className="audit-evento-meta">{formatearFechaHora(a.fechaRegistro)}</p>
                        <p className="audit-evento-quien">
                          Pagador: <strong>{a.pagadorNombre}</strong>
                          {a.registradoPorNombre && a.registradoPorNombre !== a.pagadorNombre && (
                            <> · Registrado por: <strong>{a.registradoPorNombre}</strong>
                              {a.registradoPorCargo && <span className="audit-cargo-badge">{CARGO_LABEL[a.registradoPorCargo] || a.registradoPorCargo}</span>}
                            </>
                          )}
                          {!a.registradoPorNombre && a.registradoPor === 'RESIDENTE' && <> · Autorregistrado por el residente</>}
                        </p>
                      </div>
                    </div>

                    {a.fechaVerificacion && (
                      <div className="audit-evento">
                        <div className={'audit-evento-dot ' + (a.estado === 'RECHAZADO' ? 'audit-dot-rechazo' : 'audit-dot-verificado')} />
                        <div className="audit-evento-body">
                          <p className="audit-evento-titulo">
                            {a.estado === 'RECHAZADO' ? 'Pago rechazado' : 'Pago verificado y aprobado'}
                          </p>
                          <p className="audit-evento-meta">{formatearFechaHora(a.fechaVerificacion)}</p>
                          <p className="audit-evento-quien">
                            {a.esPasarela
                              ? <>Verificado automáticamente por el sistema (pasarela de pago)</>
                              : <>
                                  Por: <strong>{a.verificadoPorNombre || '—'}</strong>
                                  {a.verificadoPorCargo && <span className="audit-cargo-badge">{CARGO_LABEL[a.verificadoPorCargo] || a.verificadoPorCargo}</span>}
                                </>
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {!a.fechaVerificacion && (
                      <div className="audit-evento">
                        <div className="audit-evento-dot audit-dot-pendiente" />
                        <div className="audit-evento-body">
                          <p className="audit-evento-titulo">Esperando verificación de un directivo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {a.observaciones && <p className="audit-obs">“{a.observaciones}”</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === 'auditoria-general' && !loading && (
        <div>
          <div className="ag-toolbar">
            <div className="ag-search-wrap">
              <IcoSearch />
              <input className="ag-search" placeholder="Buscar por acción o usuario..."
                value={agBusqueda} onChange={e => setAgBusqueda(e.target.value)} />
            </div>
            <select className="mes-select" value={agUsuario} onChange={e => setAgUsuario(e.target.value)}>
              <option value="">Todos los usuarios</option>
              {agUsuarios.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select className="mes-select" value={agTabla} onChange={e => setAgTabla(e.target.value)}>
              <option value="">Todas las áreas</option>
              {agTablas.map(t => <option key={t} value={t}>{tablaLabel(t)}</option>)}
            </select>
          </div>

          <p className="ag-count">{auditoriaGeneralFiltrada.length} evento{auditoriaGeneralFiltrada.length !== 1 ? 's' : ''}</p>

          {auditoriaGeneralFiltrada.length === 0 ? (
            <div className="empty-state">No hay eventos de auditoría con ese filtro.</div>
          ) : (
            <div className="ag-tabla-wrap">
              <table className="ag-tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Área</th>
                    <th className="ag-th-detalle">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoriaGeneralFiltrada.map(a => {
                    const abierto = agExpandId === a.id
                    const antes   = parseJson(a.datosAnteriores)
                    const despues = parseJson(a.datosNuevos)
                    const tieneDetalle = antes || despues

                    return (
                      <Fragment key={a.id}>
                        <tr className={tieneDetalle ? 'ag-row-clickable' : ''}
                          onClick={() => tieneDetalle && setAgExpandId(abierto ? null : a.id)}>
                          <td className="ag-td-muted">{formatearFechaHora(a.fecha)}</td>
                          <td className="ag-td-usuario">{a.usuarioNombre || 'Sistema'}</td>
                          <td className="ag-td-accion">{a.accion}</td>
                          <td><span className="ag-tabla-chip">{tablaLabel(a.tablaAfectada)}</span></td>
                          <td className="ag-th-detalle">
                            {tieneDetalle && <IcoChev open={abierto} />}
                          </td>
                        </tr>
                        {abierto && tieneDetalle && (
                          <tr className="ag-row-detalle">
                            <td colSpan={5}>
                              <div className="ag-detalle-grid">
                                {antes && (
                                  <div className="ag-detalle-col">
                                    <p className="ag-detalle-titulo">Antes</p>
                                    {Object.entries(antes).map(([k,v]) => (
                                      <p key={k} className="ag-detalle-item"><span>{k}</span>{String(v)}</p>
                                    ))}
                                  </div>
                                )}
                                {despues && (
                                  <div className="ag-detalle-col">
                                    <p className="ag-detalle-titulo">{antes ? 'Después' : 'Datos'}</p>
                                    {Object.entries(despues).map(([k,v]) => (
                                      <p key={k} className="ag-detalle-item"><span>{k}</span>{String(v)}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
