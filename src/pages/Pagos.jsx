import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Pagos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const METODOS = ['TRANSFERENCIA','DEPOSITO','YAPE','PLIN','EFECTIVO','OTRO']

export default function Pagos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  const ahora = new Date()
  const [mes,  setMes]  = useState(ahora.getMonth() + 1)
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [resumen,    setResumen]    = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [misCuotas,  setMisCuotas]  = useState([])
  const [configs,    setConfigs]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [tab,        setTab]        = useState(esDirectivo ? 'resumen' : 'mis-cuotas')
  const [modal,      setModal]      = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [form,       setForm]       = useState({})
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')

  useEffect(() => { cargarDatos() }, [mes, anio, tab])

  const cargarDatos = async () => {
    setLoading(true); setError('')
    try {
      if (esDirectivo) {
        if (tab === 'resumen') { const res = await api.get(`/api/pagos/resumen/${anio}/${mes}`); setResumen(res.data) }
        else if (tab === 'pendientes') { const res = await api.get('/api/pagos/pendientes'); setPendientes(res.data) }
        else if (tab === 'configurar') { const res = await api.get('/api/pagos/configuraciones'); setConfigs(res.data) }
      } else {
        const res = await api.get('/api/pagos/mis-cuotas'); setMisCuotas(res.data)
      }
    } catch (e) {
      if (e.response?.status === 400) setError(e.response.data)
      else setError('Error al cargar datos')
    } finally { setLoading(false) }
  }

  const cerrar = () => { setModal(null); setSelected(null); setMsg(''); setError('') }

  const abrirRegistrarPago = (cuota) => {
    setSelected(cuota)
    setForm({ monto: cuota.montoCalculado, metodoPago: 'TRANSFERENCIA', numeroOperacion: '', voucherUrl: '', observaciones: '' })
    setModal('pago'); setMsg(''); setError('')
  }

  const guardarPago = async () => {
    try {
      const res = await api.post('/api/pagos/registrar', {
        cuotaId: selected.cuotaId, monto: Number(form.monto),
        metodoPago: form.metodoPago, numeroOperacion: form.numeroOperacion,
        voucherUrl: form.voucherUrl, observaciones: form.observaciones
      })
      setMsg(res.data.mensaje); cargarDatos(); setTimeout(cerrar, 1500)
    } catch (e) { setError(e.response?.data || 'Error al registrar pago') }
  }

  const verificarPago = async (pagoId, accion) => {
    const obs = accion === 'RECHAZAR' ? prompt('Motivo del rechazo (opcional):') : ''
    try { await api.patch(`/api/pagos/${pagoId}/verificar`, { accion, observaciones: obs || '' }); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const abrirCrearConfig = () => {
    setForm({ mes: ahora.getMonth() + 1, anio: ahora.getFullYear(), costoPorM2: '', totalGastosEstimados: '', observaciones: '' })
    setModal('configurar'); setMsg(''); setError('')
  }

  const abrirEditarConfig = (c) => {
    setSelected(c)
    setForm({ costoPorM2: c.costoPorM2, totalGastosEstimados: c.totalGastosEstimados || '', observaciones: c.observaciones || '' })
    setModal('editarConfig'); setMsg(''); setError('')
  }

  const guardarConfiguracion = async () => {
    try {
      const res = await api.post('/api/pagos/configurar-mes', {
        mes: Number(form.mes), anio: Number(form.anio),
        costoPorM2: Number(form.costoPorM2),
        totalGastosEstimados: Number(form.totalGastosEstimados),
        observaciones: form.observaciones
      })
      setMsg(res.data.mensaje); cargarDatos(); setTimeout(cerrar, 1500)
    } catch (e) { setError(e.response?.data || 'Error al configurar') }
  }

  const guardarEdicionConfig = async () => {
    try {
      const res = await api.put(`/api/pagos/configuraciones/${selected.id}`, {
        costoPorM2: Number(form.costoPorM2),
        totalGastosEstimados: Number(form.totalGastosEstimados),
        observaciones: form.observaciones
      })
      setMsg(res.data.mensaje); cargarDatos(); setTimeout(cerrar, 1500)
    } catch (e) { setError(e.response?.data || 'Error al editar') }
  }

  const eliminarConfig = async (c) => {
    if (!confirm(`¿Eliminar configuración de ${MESES[c.mes-1]} ${c.anio}? Se eliminarán todas las cuotas y pagos asociados.`)) return
    try { await api.delete(`/api/pagos/configuraciones/${c.id}`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const estadoColor = (e) => {
    if (e === 'PAGADO' || e === 'VERIFICADO') return 'pill-success'
    if (e === 'VENCIDO' || e === 'RECHAZADO') return 'pill-danger'
    if (e === 'PENDIENTE_VERIFICACION') return 'pill-warning'
    return 'pill-neutral'
  }

  const estadoLabel = (e) => ({
    PENDIENTE:'Pendiente', PAGADO:'Pagado', VENCIDO:'Vencido', EXONERADO:'Exonerado',
    PENDIENTE_VERIFICACION:'En verificación', VERIFICADO:'Verificado', RECHAZADO:'Rechazado'
  }[e] || e)

  return (
    <div className="pagos-page">
      <h1 className="page-title">Pagos</h1>
      <p className="page-subtitle">{esDirectivo ? 'Control de pagos de mantenimiento mensual' : 'Mis cuotas de mantenimiento'}</p>

      {esDirectivo && (
        <div className="pagos-tabs">
          {[['resumen','Resumen del mes'],['pendientes','Pendientes de verificación'],['configurar','Configurar mes']].map(([k,l]) => (
            <button key={k} className={`pagos-tab ${tab === k ? 'pagos-tab-active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      )}

      {/* TAB RESUMEN */}
      {tab === 'resumen' && esDirectivo && (
        <div>
          <div className="mes-selector">
            <select className="mes-select" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {loading && <div className="loading-msg">Cargando...</div>}
          {error && <div className="alert-error">{error}</div>}
          {resumen && (
            <>
              <div className="resumen-grid">
                <div className="resumen-card rc-blue"><p className="rc-value">S/ {resumen.totalEsperado?.toFixed(2)}</p><p className="rc-label">Total esperado</p></div>
                <div className="resumen-card rc-green"><p className="rc-value">S/ {resumen.totalRecaudado?.toFixed(2)}</p><p className="rc-label">Recaudado</p></div>
                <div className="resumen-card rc-red"><p className="rc-value">S/ {resumen.totalPendiente?.toFixed(2)}</p><p className="rc-label">Por cobrar</p></div>
                <div className="resumen-card rc-neutral"><p className="rc-value">{resumen.pagados} / {resumen.totalDepartamentos}</p><p className="rc-label">Deptos pagados</p></div>
              </div>
              <div className="cuotas-lista">
                {resumen.cuotas?.map(c => (
                  <div key={c.cuotaId} className="cuota-card">
                    <div className="cuota-depto">
                      <span className="depto-num">{c.numeroDepartamento}</span>
                      <span className="depto-piso">Piso {c.piso}</span>
                    </div>
                    <div className="cuota-info">
                      {c.residentesNombres?.length > 0
                        ? c.residentesNombres.map((n,i) => <p key={i} className="cuota-responsable">{n}</p>)
                        : <p className="cuota-responsable" style={{color:'var(--text-light)',fontStyle:'italic'}}>Sin residentes asignados</p>
                      }
                    </div>
                    <div className="cuota-monto">S/ {c.montoCalculado?.toFixed(2)}</div>
                    <span className={`pill ${estadoColor(c.estadoCuota)}`}>{estadoLabel(c.estadoCuota)}</span>
                    {c.estadoCuota !== 'PAGADO' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirRegistrarPago(c)}>Registrar pago</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB PENDIENTES */}
      {tab === 'pendientes' && esDirectivo && (
        <div>
          {loading && <div className="loading-msg">Cargando...</div>}
          {pendientes.length === 0 && !loading && <div className="empty-state">No hay pagos pendientes de verificación.</div>}
          <div className="pendientes-lista">
            {pendientes.map(p => (
              <div key={p.pagoId} className="pendiente-card">
                <div className="pendiente-info">
                  <p className="pendiente-pagador">{p.pagadorNombre}</p>
                  <p className="pendiente-meta">{p.metodoPago} · {p.numeroOperacion || 'Sin N° operación'}</p>
                  {p.observaciones && <p className="pendiente-obs">{p.observaciones}</p>}
                  {p.voucherUrl && <a href={p.voucherUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver voucher</a>}
                </div>
                <div className="pendiente-monto">S/ {p.monto?.toFixed(2)}</div>
                <div className="pendiente-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => verificarPago(p.pagoId, 'APROBAR')}>Aprobar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => verificarPago(p.pagoId, 'RECHAZAR')}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONFIGURAR */}
      {tab === 'configurar' && esDirectivo && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={abrirCrearConfig}>Configurar nuevo mes</button>
          </div>
          <div className="configs-lista">
            {configs.length === 0 && <div className="empty-state">No hay configuraciones registradas.</div>}
            {configs.map(c => (
              <div key={c.id} className="config-card">
                <div>
                  <p className="config-periodo">{MESES[c.mes - 1]} {c.anio}</p>
                  <p className="config-costo">S/ {c.costoPorM2} por m²</p>
                  {c.observaciones && <p className="config-obs">{c.observaciones}</p>}
                </div>
                <div className="config-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirEditarConfig(c)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => eliminarConfig(c)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA RESIDENTE */}
      {!esDirectivo && (
        <div>
          {loading && <div className="loading-msg">Cargando...</div>}
          {error && <div className="alert-error">{error}</div>}
          {misCuotas.length === 0 && !loading && !error && <div className="empty-state">No tienes cuotas asignadas aún.</div>}
          <div className="cuotas-lista">
            {misCuotas.map(c => (
              <div key={c.cuotaId} className="cuota-card">
                <div className="cuota-depto">
                  <span className="depto-num">{c.numeroDepartamento}</span>
                  <span className="depto-piso">Piso {c.piso}</span>
                </div>
                <div className="cuota-monto">S/ {c.montoCalculado?.toFixed(2)}</div>
                <span className={`pill ${estadoColor(c.estadoCuota)}`}>{estadoLabel(c.estadoCuota)}</span>
                {c.estadoCuota === 'PENDIENTE' && (
                  <button className="btn btn-primary btn-sm" onClick={() => abrirRegistrarPago(c)}>Pagar</button>
                )}
                {c.pagos?.length > 0 && (
                  <div className="pagos-historial">
                    {c.pagos.map(p => (
                      <div key={p.pagoId} className="pago-item">
                        <span>{p.metodoPago} · S/ {p.monto?.toFixed(2)}</span>
                        <span className={`pill ${estadoColor(p.estado)}`}>{estadoLabel(p.estado)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {modal === 'pago' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Registrar pago</h3>
            <p className="modal-sub">Depto <strong>{selected?.numeroDepartamento}</strong> · S/ {selected?.montoCalculado?.toFixed(2)}</p>
            <div className="modal-scroll">
              <div className="modal-form">
                <div className="form-group"><label>Monto pagado</label><input type="number" step="0.01" value={form.monto||''} onChange={e => setForm({...form,monto:e.target.value})} /></div>
                <div className="form-group"><label>Método de pago</label><select value={form.metodoPago} onChange={e => setForm({...form,metodoPago:e.target.value})}>{METODOS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                <div className="form-group"><label>N° de operación</label><input value={form.numeroOperacion||''} onChange={e => setForm({...form,numeroOperacion:e.target.value})} placeholder="Número de transacción" /></div>
                <div className="form-group"><label>URL del voucher <span className="label-hint">(opcional)</span></label><input value={form.voucherUrl||''} onChange={e => setForm({...form,voucherUrl:e.target.value})} placeholder="https://..." /></div>
                <div className="form-group"><label>Observaciones <span className="label-hint">(opcional)</span></label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:e.target.value})} /></div>
              </div>
            </div>
            {msg && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPago}>Registrar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR CONFIG */}
      {modal === 'configurar' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Configurar mes</h3>
            <p className="modal-sub">Se generarán cuotas automáticamente para los 32 departamentos.</p>
            <div className="modal-scroll">
              <div className="modal-form">
                <div className="form-group"><label>Mes</label><select value={form.mes} onChange={e => setForm({...form,mes:e.target.value})}>{MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
                <div className="form-group"><label>Año</label><select value={form.anio} onChange={e => setForm({...form,anio:e.target.value})}>{[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
                <div className="form-group"><label>Costo por m²</label><input type="number" step="0.01" value={form.costoPorM2||''} onChange={e => setForm({...form,costoPorM2:e.target.value})} placeholder="Ej: 4.50" /></div>
                <div className="form-group"><label>Total gastos estimados <span className="label-hint">(opcional)</span></label><input type="number" step="0.01" value={form.totalGastosEstimados||''} onChange={e => setForm({...form,totalGastosEstimados:e.target.value})} /></div>
                <div className="form-group"><label>Observaciones <span className="label-hint">(opcional)</span></label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:e.target.value})} /></div>
              </div>
            </div>
            {msg && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarConfiguracion}>Generar cuotas</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CONFIG */}
      {modal === 'editarConfig' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Editar configuración</h3>
            <p className="modal-sub">{MESES[selected?.mes-1]} {selected?.anio}</p>
            <div className="modal-form" style={{marginTop:14}}>
              <div className="form-group"><label>Costo por m²</label><input type="number" step="0.01" value={form.costoPorM2||''} onChange={e => setForm({...form,costoPorM2:e.target.value})} /></div>
              <div className="form-group"><label>Total gastos estimados <span className="label-hint">(opcional)</span></label><input type="number" step="0.01" value={form.totalGastosEstimados||''} onChange={e => setForm({...form,totalGastosEstimados:e.target.value})} /></div>
              <div className="form-group"><label>Observaciones</label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:e.target.value})} /></div>
            </div>
            {msg && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarEdicionConfig}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
