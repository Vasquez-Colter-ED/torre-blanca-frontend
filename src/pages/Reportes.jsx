import { useState, useEffect, useRef, Fragment } from 'react'
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import api from '../services/api'
import './Reportes.css'

// Colores de marca — mismos que usa la UI, para que el Excel exportado
// se vea consistente con lo que el directivo ve en pantalla
const BRAND = {
  azul:       'FF2563EB',
  azulOscuro: 'FF0F172A',
  verde:      'FF059669',
  rojo:       'FFDC2626',
  naranja:    'FFD97706',
  grisFondo:  'FFF8FAFC',
  grisBorde:  'FFE2E8F0',
  blanco:     'FFFFFFFF',
}

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
const IcoTarget    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>
const IcoWallet    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
const IcoTag       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IcoScale     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 7 0z"/><path d="M19 7l-3 7a3.5 3.5 0 0 0 7 0z"/><path d="M5 7h14"/><path d="M9 3h6"/></svg>
const IcoBuilding2 = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoTrendUp   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IcoTrendDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>

function Tendencia({ actual, anterior }) {
  if (anterior == null || anterior === 0 || actual == null) return null
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100
  if (Math.abs(pct) < 0.5) return <span className="rep-trend rep-trend-flat">Igual que el mes anterior</span>
  const sube = pct > 0
  return (
    <span className={`rep-trend ${sube ? 'rep-trend-up' : 'rep-trend-down'}`}>
      {sube ? <IcoTrendUp /> : <IcoTrendDown />} {Math.abs(pct).toFixed(0)}% vs mes anterior
    </span>
  )
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
  const [reporteMesAnt, setReporteMesAnt] = useState(null)
  const [reporteAnio, setReporteAnio] = useState(null)
  const [auditoria,   setAuditoria]   = useState([])
  const [filtroAuditoria, setFiltroAuditoria] = useState('TODOS')
  const [auditoriaGeneral, setAuditoriaGeneral] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [separarCaja, setSepararCaja] = useState(false)
  const [exportando,  setExportando]  = useState(false)

  // Períodos que SÍ tienen configuración de mantenimiento real (mes/año con
  // data). Se usan para poblar los selects — así nunca se puede elegir un
  // período vacío que el backend rechazaría con "No hay configuración para X/Y"
  const [configuraciones, setConfiguraciones] = useState([])
  const [configsListas,   setConfigsListas]   = useState(false)

  // Refs a las tarjetas de gráficas, para capturarlas como imagen al exportar a Excel
  const refPie      = useRef(null)
  const refBarraMes = useRef(null)
  const refBarraAnio = useRef(null)
  const refAreaAnio  = useRef(null)

  // Auditoría general — filtros
  const [agBusqueda, setAgBusqueda] = useState('')
  const [agUsuario,  setAgUsuario]  = useState('')
  const [agTabla,    setAgTabla]    = useState('')
  const [agExpandId, setAgExpandId] = useState(null)

  useEffect(() => { cargarConfiguraciones() }, [])
  // Espera a que las configuraciones ya se hayan resuelto (para no disparar
  // un fetch con el mes/año por defecto si ese período no tiene data)
  useEffect(() => { if (configsListas) cargarDatos() }, [tab, mes, anio, configsListas])

  // Trae todos los mes/año con configuración real y, si el mes/año actual
  // (por defecto) no tiene data, salta automáticamente al período
  // configurado más reciente — para no arrancar con un reporte vacío/error
  const cargarConfiguraciones = async () => {
    try {
      const r = await api.get('/api/pagos/configuraciones')
      const lista = r.data || []
      setConfiguraciones(lista)
      const hoyConfigurado = lista.some(c => c.mes === ahora.getMonth() + 1 && c.anio === ahora.getFullYear())
      if (!hoyConfigurado && lista.length > 0) {
        const masReciente = [...lista].sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes))[0]
        setAnio(masReciente.anio)
        setMes(masReciente.mes)
      }
    } catch { /* si falla, se deja el mes/año actual por defecto */ }
    finally { setConfigsListas(true) }
  }

  // Años que sí tienen al menos un mes configurado, más recientes primero
  const aniosConfigurados = [...new Set(configuraciones.map(c => c.anio))].sort((a, b) => b - a)
  // Meses configurados para el año actualmente seleccionado (para el tab mensual/auditoría)
  const mesesConfigurados = configuraciones.filter(c => c.anio === anio).map(c => c.mes).sort((a, b) => a - b)

  // Si al cambiar de año el mes que teníamos seleccionado ya no existe en
  // ese año (no tiene configuración), salta automáticamente al más reciente
  // disponible de ese año — evita quedarse en un mes sin data
  useEffect(() => {
    if (!configsListas || mesesConfigurados.length === 0) return
    if (!mesesConfigurados.includes(mes)) setMes(mesesConfigurados[mesesConfigurados.length - 1])
  }, [anio, configsListas])

  const cargarDatos = async () => {
    setLoading(true); setError('')
    try {
      if (tab === 'mensual') {
        const r = await api.get('/api/reportes/mes/' + anio + '/' + mes)
        setReporteMes(r.data)
        // Mes anterior, solo para calcular la tendencia de las tarjetas (silencioso si falla)
        const mesAnt  = mes === 1 ? 12 : mes - 1
        const anioAnt = mes === 1 ? anio - 1 : anio
        try {
          const rAnt = await api.get('/api/reportes/mes/' + anioAnt + '/' + mesAnt)
          setReporteMesAnt(rAnt.data)
        } catch { setReporteMesAnt(null) }
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

  // ── Estilos reutilizables para las hojas de Excel — mismo lenguaje
  // visual (azules, tipografia, bordes) que ya usa la web ──────────
  const estiloTituloHoja = (cell, texto) => {
    cell.value = texto
    cell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: BRAND.blanco } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.azulOscuro } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  }
  const estiloSubtitulo = (cell, texto) => {
    cell.value = texto
    cell.font = { name: 'Calibri', size: 10.5, italic: true, color: { argb: 'FF64748B' } }
    cell.alignment = { indent: 1 }
  }
  const estiloHeaderTabla = (row) => {
    row.eachCell(cell => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND.blanco } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.azul } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    row.height = 20
  }
  const bordeFino = { style: 'thin', color: { argb: BRAND.grisBorde } }
  const bordeCelda = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino }
  const zebra = (row, i) => row.eachCell(c => { c.border = bordeCelda; if (i % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.grisFondo } } })
  const FMT_MONEDA = '"S/" #,##0.00'

  // Captura un nodo del DOM (una tarjeta de gráfica ya renderizada) como
  // imagen PNG, para insertarla tal cual se ve en pantalla dentro del Excel
  const capturarGrafica = async (ref, html2canvas) => {
    if (!ref?.current) return null
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      return { base64: canvas.toDataURL('image/png'), width: canvas.width / 2, height: canvas.height / 2 }
    } catch { return null } // si falla la captura, el Excel se genera igual sin esa imagen
  }

  const exportarMensual = async () => {
    if (!reporteMes) return
    setExportando(true); setError('')
    try {
      const [ExcelJSMod, { default: html2canvas }] = await Promise.all([import('exceljs'), import('html2canvas')])
      const ExcelJS = ExcelJSMod.default || ExcelJSMod
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Torre Blanca'; wb.created = new Date()

      // ── Hoja 1: Resumen ──────────────────────────────────────
      const ws = wb.addWorksheet('Resumen', { views: [{ state: 'frozen', ySplit: 4 }] })
      ws.columns = [{ width: 32 }, { width: 20 }]
      ws.mergeCells('A1:B1')
      estiloTituloHoja(ws.getCell('A1'), 'REPORTE MENSUAL — RESIDENCIAL TORRE BLANCA')
      ws.getRow(1).height = 28
      ws.mergeCells('A2:B2')
      estiloSubtitulo(ws.getCell('A2'), `Período: ${MESES[mes-1]} ${anio}  ·  Generado el ${new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'})}`)
      ws.addRow([])

      estiloHeaderTabla(ws.addRow(['Concepto', 'Monto (S/)']))
      const filasResumen = [
        ['Total esperado',   Number(reporteMes.totalEsperado), false],
        ['Total recaudado',   Number(reporteMes.totalRecaudado), true],
        ['   · Efectivo',     Number(reporteMes.recaudadoEfectivo || 0), false],
        ['   · Digital',      Number(reporteMes.recaudadoDigital || 0), false],
        ['Total gastos',      Number(reporteMes.totalGastos), true],
        ['Balance',           Number(reporteMes.balance), true],
      ]
      filasResumen.forEach(([concepto, monto, negrita], i) => {
        const row = ws.addRow([concepto, monto])
        row.getCell(1).font = { name: 'Calibri', size: 11, bold: negrita }
        row.getCell(2).numFmt = FMT_MONEDA
        row.getCell(2).font = { name: 'Calibri', size: 11, bold: negrita }
        zebra(row, i)
        if (concepto === 'Balance') {
          const positivo = Number(reporteMes.balance) >= 0
          row.getCell(2).font = { ...row.getCell(2).font, color: { argb: positivo ? BRAND.verde : BRAND.rojo } }
        }
      })
      ws.addRow([])
      const rowDeptos = ws.addRow(['Departamentos pagados', `${reporteMes.deptosPagados} / ${reporteMes.deptosTotal}`])
      rowDeptos.getCell(1).font = { bold: true }
      rowDeptos.getCell(2).alignment = { horizontal: 'center' }
      rowDeptos.eachCell(c => c.border = bordeCelda)

      // ── Hoja 2: Deudores ─────────────────────────────────────
      const wsD = wb.addWorksheet('Deudores', { views: [{ state: 'frozen', ySplit: 4 }] })
      wsD.columns = [{ width: 14 }, { width: 10 }, { width: 34 }, { width: 18 }]
      wsD.mergeCells('A1:D1')
      estiloTituloHoja(wsD.getCell('A1'), 'DEPARTAMENTOS PENDIENTES DE PAGO')
      wsD.getRow(1).height = 28
      wsD.mergeCells('A2:D2')
      estiloSubtitulo(wsD.getCell('A2'), `${MESES[mes-1]} ${anio}  ·  ${(reporteMes.deudores||[]).length} departamento(s) con saldo pendiente`)
      wsD.addRow([])
      estiloHeaderTabla(wsD.addRow(['Departamento', 'Piso', 'Residente(s)', 'Monto pendiente']))
      ;(reporteMes.deudores || []).forEach((d, i) => {
        const row = wsD.addRow([d.numeroDepartamento, d.piso, d.residentesNombres, Number(d.montoPendiente)])
        row.getCell(4).numFmt = FMT_MONEDA
        row.getCell(4).font = { color: { argb: BRAND.rojo }, bold: true }
        row.getCell(1).alignment = { horizontal: 'center' }
        row.getCell(2).alignment = { horizontal: 'center' }
        zebra(row, i)
      })
      if ((reporteMes.deudores || []).length === 0) {
        wsD.mergeCells('A5:D5')
        wsD.getCell('A5').value = 'No hay departamentos con saldo pendiente este mes.'
        wsD.getCell('A5').font = { italic: true, color: { argb: 'FF64748B' } }
      }

      // ── Hoja 3: Gastos por categoría ─────────────────────────
      const wsG = wb.addWorksheet('Gastos', { views: [{ state: 'frozen', ySplit: 4 }] })
      wsG.columns = [{ width: 28 }, { width: 18 }]
      wsG.mergeCells('A1:B1')
      estiloTituloHoja(wsG.getCell('A1'), 'GASTOS POR CATEGORÍA')
      wsG.getRow(1).height = 28
      wsG.mergeCells('A2:B2')
      estiloSubtitulo(wsG.getCell('A2'), `${MESES[mes-1]} ${anio}  ·  Total: S/ ${Number(reporteMes.totalGastos).toFixed(2)}`)
      wsG.addRow([])
      estiloHeaderTabla(wsG.addRow(['Categoría', 'Total (S/)']))
      Object.entries(reporteMes.gastosPorCategoria || {}).forEach(([k, v], i) => {
        const row = wsG.addRow([k, Number(v)])
        row.getCell(2).numFmt = FMT_MONEDA
        zebra(row, i)
      })

      // ── Hoja 4: Gráficos — las mismas gráficas que se ven en pantalla,
      // capturadas como imagen e insertadas en el Excel ────────────
      const [imgPie, imgBarra] = await Promise.all([
        capturarGrafica(refPie, html2canvas),
        capturarGrafica(refBarraMes, html2canvas),
      ])
      if (imgPie || imgBarra) {
        const wsGr = wb.addWorksheet('Gráficos')
        wsGr.mergeCells('A1:H1')
        estiloTituloHoja(wsGr.getCell('A1'), `GRÁFICOS — ${MESES[mes-1].toUpperCase()} ${anio}`)
        wsGr.getRow(1).height = 28
        let col = 0
        if (imgPie) {
          const id = wb.addImage({ base64: imgPie.base64, extension: 'png' })
          wsGr.addImage(id, { tl: { col, row: 2 }, ext: { width: imgPie.width, height: imgPie.height } })
          col += imgPie.width / 64 + 1
        }
        if (imgBarra) {
          const id = wb.addImage({ base64: imgBarra.base64, extension: 'png' })
          wsGr.addImage(id, { tl: { col, row: 2 }, ext: { width: imgBarra.width, height: imgBarra.height } })
        }
      }

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `Reporte_TorreBlanca_${MESES[mes-1]}_${anio}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el Excel. Intenta nuevamente.')
    } finally { setExportando(false) }
  }

  const exportarAnual = async () => {
    if (!reporteAnio) return
    setExportando(true); setError('')
    try {
      const [ExcelJSMod, { default: html2canvas }] = await Promise.all([import('exceljs'), import('html2canvas')])
      const ExcelJS = ExcelJSMod.default || ExcelJSMod
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Torre Blanca'; wb.created = new Date()

      // ── Hoja 1: Resumen anual ────────────────────────────────
      const ws = wb.addWorksheet('Resumen anual', { views: [{ state: 'frozen', ySplit: 4 }] })
      const separar = separarCaja
      ws.columns = separar
        ? [{ width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }]
        : [{ width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }]
      const totalCols = separar ? 8 : 6
      ws.mergeCells(1, 1, 1, totalCols)
      estiloTituloHoja(ws.getCell(1, 1), `REPORTE ANUAL — RESIDENCIAL TORRE BLANCA`)
      ws.getRow(1).height = 28
      ws.mergeCells(2, 1, 2, totalCols)
      estiloSubtitulo(ws.getCell(2, 1), `Año ${anio}  ·  Generado el ${new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'})}`)
      ws.addRow([])

      const totales = [
        ['Total recaudado', Number(reporteAnio.totalRecaudadoAnio)],
        ['Total gastos',     Number(reporteAnio.totalGastosAnio)],
        ['Balance del año',  Number(reporteAnio.balanceAnio)],
      ]
      totales.forEach(([concepto, monto], i) => {
        const row = ws.addRow([concepto, monto])
        row.getCell(1).font = { bold: true }
        row.getCell(2).numFmt = FMT_MONEDA
        row.getCell(2).font = { bold: true, color: concepto.startsWith('Balance') ? { argb: monto >= 0 ? BRAND.verde : BRAND.rojo } : undefined }
        zebra(row, i)
      })
      ws.addRow([])

      const encabezados = separar
        ? ['Mes','Efectivo (S/)','Digital (S/)','Gastos (S/)','Balance (S/)','Deptos pagados','Total deptos']
        : ['Mes','Recaudado (S/)','Gastos (S/)','Balance (S/)','Deptos pagados','Total deptos']
      estiloHeaderTabla(ws.addRow(encabezados))
      ;(reporteAnio.datosMensuales || []).forEach((d, i) => {
        const valores = separar
          ? [d.mes, Number(d.recaudadoEfectivo||0), Number(d.recaudadoDigital||0), Number(d.gastos), Number(d.balance), d.pagados, d.total]
          : [d.mes, Number(d.recaudado), Number(d.gastos), Number(d.balance), d.pagados, d.total]
        const row = ws.addRow(valores)
        const colBalance = separar ? 5 : 4
        row.eachCell((cell, colNum) => {
          if (colNum > 1 && colNum < (separar ? 6 : 5)) cell.numFmt = FMT_MONEDA
          if (colNum === colBalance) cell.font = { color: { argb: Number(d.balance) >= 0 ? BRAND.verde : BRAND.rojo }, bold: true }
        })
        zebra(row, i)
      })

      // ── Hoja 2: Gráficos ─────────────────────────────────────
      const [imgBarra, imgArea] = await Promise.all([
        capturarGrafica(refBarraAnio, html2canvas),
        capturarGrafica(refAreaAnio, html2canvas),
      ])
      if (imgBarra || imgArea) {
        const wsGr = wb.addWorksheet('Gráficos')
        wsGr.mergeCells('A1:H1')
        estiloTituloHoja(wsGr.getCell('A1'), `GRÁFICOS — AÑO ${anio}`)
        wsGr.getRow(1).height = 28
        let filaCursor = 2
        if (imgBarra) {
          const id = wb.addImage({ base64: imgBarra.base64, extension: 'png' })
          wsGr.addImage(id, { tl: { col: 0, row: filaCursor }, ext: { width: imgBarra.width, height: imgBarra.height } })
          filaCursor += Math.ceil(imgBarra.height / 20) + 2
        }
        if (imgArea) {
          const id = wb.addImage({ base64: imgArea.base64, extension: 'png' })
          wsGr.addImage(id, { tl: { col: 0, row: filaCursor }, ext: { width: imgArea.width, height: imgArea.height } })
        }
      }

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `Reporte_TorreBlanca_${anio}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el Excel. Intenta nuevamente.')
    } finally { setExportando(false) }
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
          <button className="btn btn-export" onClick={tab==='mensual' ? exportarMensual : exportarAnual} disabled={loading || exportando}>
            <IcoDownload /> {exportando ? 'Generando Excel...' : 'Exportar Excel'}
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
              {(mesesConfigurados.length > 0 ? mesesConfigurados : [mes]).map(m => <option key={m} value={m}>{MESES[m-1]}</option>)}
            </select>
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {(aniosConfigurados.length > 0 ? aniosConfigurados : [anio]).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
        {tab === 'anual' && (
          <div className="mes-selector">
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {(aniosConfigurados.length > 0 ? aniosConfigurados : [anio]).map(a => <option key={a} value={a}>{a}</option>)}
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
            <div className="rep-stat rc-blue">
              <div className="rep-stat-top">
                <span className="rep-stat-icon rsi-blue"><IcoTarget /></span>
                <p className="rep-stat-label">Total esperado</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteMes.totalEsperado).toFixed(2)}</p>
            </div>

            {separarCaja ? (
              <>
                <div className="rep-stat rc-green">
                  <div className="rep-stat-top">
                    <span className="rep-stat-icon rsi-green"><IcoCash /></span>
                    <p className="rep-stat-label">Efectivo</p>
                  </div>
                  <p className="rep-stat-valor">S/ {Number(reporteMes.recaudadoEfectivo||0).toFixed(2)}</p>
                  <Tendencia actual={Number(reporteMes.recaudadoEfectivo||0)} anterior={reporteMesAnt ? Number(reporteMesAnt.recaudadoEfectivo||0) : null} />
                </div>
                <div className="rep-stat rc-indigo">
                  <div className="rep-stat-top">
                    <span className="rep-stat-icon rsi-indigo"><IcoBank /></span>
                    <p className="rep-stat-label">Digital</p>
                  </div>
                  <p className="rep-stat-valor">S/ {Number(reporteMes.recaudadoDigital||0).toFixed(2)}</p>
                  <Tendencia actual={Number(reporteMes.recaudadoDigital||0)} anterior={reporteMesAnt ? Number(reporteMesAnt.recaudadoDigital||0) : null} />
                </div>
              </>
            ) : (
              <div className="rep-stat rc-green">
                <div className="rep-stat-top">
                  <span className="rep-stat-icon rsi-green"><IcoWallet /></span>
                  <p className="rep-stat-label">Recaudado</p>
                </div>
                <p className="rep-stat-valor">S/ {Number(reporteMes.totalRecaudado).toFixed(2)}</p>
                <Tendencia actual={Number(reporteMes.totalRecaudado)} anterior={reporteMesAnt ? Number(reporteMesAnt.totalRecaudado) : null} />
              </div>
            )}

            <div className="rep-stat rc-orange">
              <div className="rep-stat-top">
                <span className="rep-stat-icon rsi-orange"><IcoTag /></span>
                <p className="rep-stat-label">Gastos</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteMes.totalGastos).toFixed(2)}</p>
              <Tendencia actual={Number(reporteMes.totalGastos)} anterior={reporteMesAnt ? Number(reporteMesAnt.totalGastos) : null} />
            </div>
            <div className={'rep-stat ' + (Number(reporteMes.balance)>=0?'rc-green':'rc-red')}>
              <div className="rep-stat-top">
                <span className={'rep-stat-icon ' + (Number(reporteMes.balance)>=0?'rsi-green':'rsi-red')}><IcoScale /></span>
                <p className="rep-stat-label">Balance</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteMes.balance).toFixed(2)}</p>
              <Tendencia actual={Number(reporteMes.balance)} anterior={reporteMesAnt ? Number(reporteMesAnt.balance) : null} />
            </div>
            <div className="rep-stat rc-neutral">
              <div className="rep-stat-top">
                <span className="rep-stat-icon rsi-neutral"><IcoBuilding2 /></span>
                <p className="rep-stat-label">Deptos pagados</p>
              </div>
              <p className="rep-stat-valor">{reporteMes.deptosPagados} / {reporteMes.deptosTotal}</p>
            </div>
          </div>

          <div className="charts-row">
            {pieData.length > 0 && (
              <div className="chart-card" ref={refPie}>
                <h3 className="chart-title">Gastos por categoría</h3>
                <div className="pie-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {PIE_COLORS.map((c, i) => (
                        <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.72} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={pieData} cx="50%" cy="50%" innerRadius={62} outerRadius={95}
                      dataKey="value" nameKey="name" paddingAngle={3} stroke="#fff" strokeWidth={2}
                      label={({ percent }) => `${(percent*100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_,i) => <Cell key={i} fill={`url(#pieGrad${i%PIE_COLORS.length})`} />)}
                    </Pie>
                    <Tooltip formatter={(v) => 'S/ ' + Number(v).toFixed(2)} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-center-total">
                  <span className="pie-center-lbl">Total gastos</span>
                  <span className="pie-center-val">S/ {Number(reporteMes.totalGastos).toFixed(0)}</span>
                </div>
                </div>
              </div>
            )}
            <div className="chart-card" ref={refBarraMes}>
              <h3 className="chart-title">Resumen financiero</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={separarCaja
                    ? [{ name: MESES[mes-1], Efectivo: Number(reporteMes.recaudadoEfectivo||0), Digital: Number(reporteMes.recaudadoDigital||0), Gastos: Number(reporteMes.totalGastos) }]
                    : [{ name: MESES[mes-1], Recaudado: Number(reporteMes.totalRecaudado), Gastos: Number(reporteMes.totalGastos) }]
                  }
                  margin={{top:24,right:10,left:0,bottom:0}} barGap={10}>
                  <defs>
                    <linearGradient id="gradEfectivo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} /><stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradDigital" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradRecaudado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity={1} /><stop offset="100%" stopColor="#D97706" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize:12}} axisLine={{stroke:'#E2E8F0'}} tickLine={false} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/ '+v} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {separarCaja ? (
                    <>
                      <Bar dataKey="Efectivo" fill="url(#gradEfectivo)" radius={[6,6,0,0]} maxBarSize={64}>
                        <LabelList dataKey="Efectivo" position="top" formatter={v => 'S/'+Number(v).toFixed(0)} style={{ fontSize: 11, fontWeight: 700, fill: '#0F172A' }} />
                      </Bar>
                      <Bar dataKey="Digital" fill="url(#gradDigital)" radius={[6,6,0,0]} maxBarSize={64}>
                        <LabelList dataKey="Digital" position="top" formatter={v => 'S/'+Number(v).toFixed(0)} style={{ fontSize: 11, fontWeight: 700, fill: '#0F172A' }} />
                      </Bar>
                      <Bar dataKey="Gastos" fill="url(#gradGastos)" radius={[6,6,0,0]} maxBarSize={64}>
                        <LabelList dataKey="Gastos" position="top" formatter={v => 'S/'+Number(v).toFixed(0)} style={{ fontSize: 11, fontWeight: 700, fill: '#0F172A' }} />
                      </Bar>
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Recaudado" fill="url(#gradRecaudado)" radius={[6,6,0,0]} maxBarSize={72}>
                        <LabelList dataKey="Recaudado" position="top" formatter={v => 'S/'+Number(v).toFixed(0)} style={{ fontSize: 11, fontWeight: 700, fill: '#0F172A' }} />
                      </Bar>
                      <Bar dataKey="Gastos" fill="url(#gradGastos)" radius={[6,6,0,0]} maxBarSize={72}>
                        <LabelList dataKey="Gastos" position="top" formatter={v => 'S/'+Number(v).toFixed(0)} style={{ fontSize: 11, fontWeight: 700, fill: '#0F172A' }} />
                      </Bar>
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
            <div className="rep-stat rc-blue">
              <div className="rep-stat-top">
                <span className="rep-stat-icon rsi-blue"><IcoWallet /></span>
                <p className="rep-stat-label">Recaudado {anio}</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteAnio.totalRecaudadoAnio).toFixed(2)}</p>
            </div>
            <div className="rep-stat rc-orange">
              <div className="rep-stat-top">
                <span className="rep-stat-icon rsi-orange"><IcoTag /></span>
                <p className="rep-stat-label">Gastos {anio}</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteAnio.totalGastosAnio).toFixed(2)}</p>
            </div>
            <div className={'rep-stat ' + (Number(reporteAnio.balanceAnio)>=0?'rc-green':'rc-red')}>
              <div className="rep-stat-top">
                <span className={'rep-stat-icon ' + (Number(reporteAnio.balanceAnio)>=0?'rsi-green':'rsi-red')}><IcoScale /></span>
                <p className="rep-stat-label">Balance {anio}</p>
              </div>
              <p className="rep-stat-valor">S/ {Number(reporteAnio.balanceAnio).toFixed(2)}</p>
            </div>
          </div>

          <div className="chart-card chart-full" ref={refBarraAnio}>
            <h3 className="chart-title">{separarCaja ? 'Efectivo vs Digital vs Gastos por mes' : 'Recaudado vs Gastos por mes'} — {anio}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}} barGap={6}>
                <defs>
                  <linearGradient id="gradEfectivoA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981"/><stop offset="100%" stopColor="#059669" stopOpacity={0.85}/></linearGradient>
                  <linearGradient id="gradDigitalA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#2563EB" stopOpacity={0.85}/></linearGradient>
                  <linearGradient id="gradRecaudadoA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#2563EB" stopOpacity={0.85}/></linearGradient>
                  <linearGradient id="gradGastosA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBBF24"/><stop offset="100%" stopColor="#D97706" stopOpacity={0.85}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="mes" tick={{fontSize:11}} axisLine={{stroke:'#E2E8F0'}} tickLine={false} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {separarCaja ? (
                  <>
                    <Bar dataKey="recaudadoEfectivo" name="Efectivo" fill="url(#gradEfectivoA)" radius={[3,3,0,0]} maxBarSize={28} />
                    <Bar dataKey="recaudadoDigital"  name="Digital"  fill="url(#gradDigitalA)"  radius={[3,3,0,0]} maxBarSize={28} />
                    <Bar dataKey="gastos"            name="Gastos"  fill="url(#gradGastosA)"   radius={[3,3,0,0]} maxBarSize={28} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="recaudado" name="Recaudado" fill="url(#gradRecaudadoA)" radius={[4,4,0,0]} maxBarSize={36} />
                    <Bar dataKey="gastos"    name="Gastos"    fill="url(#gradGastosA)"    radius={[4,4,0,0]} maxBarSize={36} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card chart-full" ref={refAreaAnio}>
            <h3 className="chart-title">Tendencia de balance — {anio}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={reporteAnio.datosMensuales} margin={{top:10,right:10,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gradBalanceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="mes" tick={{fontSize:11}} axisLine={{stroke:'#E2E8F0'}} tickLine={false} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => 'S/'+v} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="balance" name="Balance" stroke="#059669" strokeWidth={2.5}
                  fill="url(#gradBalanceArea)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} dot={{ r: 3.5, fill: '#059669', strokeWidth: 0 }} />
              </AreaChart>
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
                        {a.loteId && a.loteMesesCubre?.length > 0 && (
                          <p className="audit-lote-nota">
                            Pago múltiple — el mismo comprobante también cubre: {a.loteMesesCubre.join(' · ')}
                          </p>
                        )}
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
