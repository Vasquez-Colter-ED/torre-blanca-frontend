import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import api from '../services/api'
import './Reportes.css'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const PIE_COLORS = ['#1B4F8A','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#F97316','#EF4444','#6B7280']

const CARGO_LABEL = { PRESIDENTE: 'Presidente', SECRETARIO: 'Secretario', TESORERO: 'Tesorero' }

const formatearFechaHora = (iso) => {
  if (!iso) return '—'
  const f = new Date(iso)
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

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
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

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
      ['Mes','Recaudado (S/)','Gastos (S/)','Balance (S/)','Deptos pagados','Total deptos'],
      ...(reporteAnio.datosMensuales||[]).map(d => [d.mes, Number(d.recaudado).toFixed(2), Number(d.gastos).toFixed(2), Number(d.balance).toFixed(2), d.pagados, d.total])
    ]), 'Resumen anual')
    XLSX.writeFile(wb, 'Reporte_TorreBlanca_' + anio + '.xlsx')
  }

  const pieData = reporteMes ? Object.entries(reporteMes.gastosPorCategoria||{}).map(([name,value]) => ({ name, value: Number(value) })) : []

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Análisis financiero de Torre Blanca</p>
        </div>
        <button className="btn btn-export" onClick={tab==='mensual' ? exportarMensual : exportarAnual} disabled={loading || tab === 'auditoria'} style={tab === 'auditoria' ? { visibility: 'hidden' } : {}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel
        </button>
      </div>

      <div className="pagos-tabs">
        <button className={'pagos-tab ' + (tab==='mensual'?'pagos-tab-active':'')} onClick={() => setTab('mensual')}>Reporte mensual</button>
        <button className={'pagos-tab ' + (tab==='anual'?'pagos-tab-active':'')} onClick={() => setTab('anual')}>Reporte anual</button>
        <button className={'pagos-tab ' + (tab==='auditoria'?'pagos-tab-active':'')} onClick={() => setTab('auditoria')}>Auditoría</button>
      </div>

      <div className="mes-selector" style={{marginBottom:20}}>
        {(tab === 'mensual' || tab === 'auditoria') && (
          <select className="mes-select" value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        )}
        <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading && <div className="loading-msg">Cargando reporte...</div>}
      {error   && <div className="alert-error">{error}</div>}

      {tab === 'mensual' && reporteMes && !loading && (
        <div>
          <div className="rep-stats">
            <div className="rep-stat rc-blue"><p className="rep-stat-label">Total esperado</p><p className="rep-stat-valor">S/ {Number(reporteMes.totalEsperado).toFixed(2)}</p></div>
            <div className="rep-stat rc-green"><p className="rep-stat-label">Recaudado</p><p className="rep-stat-valor">S/ {Number(reporteMes.totalRecaudado).toFixed(2)}</p></div>
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
                <BarChart data={[{ name: MESES[mes-1], Recaudado: Number(reporteMes.totalRecaudado), Gastos: Number(reporteMes.totalGastos) }]} margin={{top:10,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE6" />
                  <XAxis dataKey="name" tick={{fontSize:12}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/ '+v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Recaudado" fill="#1B4F8A" radius={[4,4,0,0]} />
                  <Bar dataKey="Gastos"    fill="#F97316" radius={[4,4,0,0]} />
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
            <h3 className="chart-title">Recaudado vs Gastos por mes — {anio}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE6" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="recaudado" name="Recaudado" fill="#1B4F8A" radius={[3,3,0,0]} />
                <Bar dataKey="gastos"    name="Gastos"    fill="#F97316" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card chart-full">
            <h3 className="chart-title">Tendencia de balance — {anio}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE6" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#10B981" strokeWidth={2.5} dot={{r:4,fill:'#10B981'}} />
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
    </div>
  )
}
