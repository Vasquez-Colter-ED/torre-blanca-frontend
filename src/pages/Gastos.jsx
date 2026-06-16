import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { textoLibreEstricto } from '../utils/validaciones'
import './Gastos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const CAT_COLOR = { 'Luz':'#F59E0B','Agua':'#3B82F6','Limpieza':'#10B981','Seguridad':'#6366F1','Mantenimiento Ascensor':'#8B5CF6','Cámaras de Seguridad':'#EC4899','Materiales':'#F97316','Contingencia':'#EF4444','Otros':'#6B7280' }

export default function Gastos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  const ahora = new Date()
  const [gastos,     setGastos]     = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroMes,  setFiltroMes]  = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [modal,      setModal]      = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [form,       setForm]       = useState({})
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [g, c] = await Promise.all([api.get('/api/gastos'), api.get('/api/gastos/categorias')])
      setGastos(g.data); setCategorias(c.data)
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const cerrar = () => { setModal(null); setSelected(null); setMsg(''); setError('') }

  const abrirCrear = () => {
    setForm({ categoriaId:'', descripcion:'', monto:'', fechaGasto: ahora.toISOString().split('T')[0], comprobanteUrl:'' })
    setModal('form'); setMsg(''); setError('')
  }

  const abrirEditar = (g) => {
    setSelected(g)
    setForm({ categoriaId: categorias.find(c => c.nombre === g.categoria)?.id || '', descripcion: g.descripcion, monto: g.monto, fechaGasto: g.fechaGasto, comprobanteUrl: g.comprobanteUrl || '' })
    setModal('form'); setMsg(''); setError('')
  }

  const guardar = async () => {
    try {
      if (selected) await api.put('/api/gastos/' + selected.id, form)
      else await api.post('/api/gastos', form)
      setMsg(selected ? 'Gasto actualizado' : 'Gasto registrado correctamente')
      cargarDatos(); setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error al guardar') }
  }

  const eliminar = async (g) => {
    if (!confirm('¿Eliminar gasto de S/ ' + g.monto + '?')) return
    try { await api.delete('/api/gastos/' + g.id); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const filtrados = gastos.filter(g => {
    if (filtroMes  && g.mes  !== Number(filtroMes))  return false
    if (filtroAnio && g.anio !== Number(filtroAnio)) return false
    return true
  })

  const totalFiltrado = filtrados.reduce((s, g) => s + Number(g.monto), 0)

  if (loading) return <div className="loading-msg">Cargando gastos...</div>

  return (
    <div className="gastos-page">
      <h1 className="page-title">Gastos</h1>
      <p className="page-subtitle">Registro de gastos del edificio Torre Blanca</p>

      <div className="gastos-toolbar">
        <select className="mes-select" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="mes-select" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {esDirectivo && <button className="btn btn-primary" onClick={abrirCrear}>Registrar gasto</button>}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {filtrados.length > 0 && (
        <div className="gastos-total">
          <span className="total-label">Total {filtroMes && filtroAnio ? MESES[Number(filtroMes)-1]+' '+filtroAnio : 'filtrado'}:</span>
          <span className="total-valor">S/ {totalFiltrado.toFixed(2)}</span>
        </div>
      )}

      {filtrados.length === 0 && <div className="empty-state">No hay gastos para el período seleccionado.</div>}

      <div className="gastos-lista">
        {filtrados.map(g => (
          <div key={g.id} className="gasto-card">
            <div className="gasto-cat-dot" style={{ background: CAT_COLOR[g.categoria] || '#6B7280' }} />
            <div className="gasto-info">
              <div className="gasto-header">
                <span className="gasto-categoria" style={{ color: CAT_COLOR[g.categoria] || '#6B7280' }}>{g.categoria}</span>
                <span className="gasto-fecha">{g.fechaGasto}</span>
              </div>
              <p className="gasto-desc">{g.descripcion}</p>
              {g.registradoPorNombre && <p className="gasto-by">Registrado por {g.registradoPorNombre}</p>}
              {g.comprobanteUrl && <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver comprobante</a>}
            </div>
            <div className="gasto-monto">S/ {Number(g.monto).toFixed(2)}</div>
            {esDirectivo && (
              <div className="gasto-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(g)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => eliminar(g)}>Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal === 'form' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">{selected ? 'Editar gasto' : 'Registrar gasto'}</h3>
            <div className="modal-scroll">
              <div className="modal-form">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.categoriaId||''} onChange={e => setForm({...form,categoriaId:e.target.value})}>
                    <option value="">-- Selecciona --</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Descripción <span className="label-hint">(sin caracteres especiales)</span></label>
                  <input value={form.descripcion||''} onChange={e => setForm({...form,descripcion: textoLibreEstricto(e.target.value)})} placeholder="Ej: Pago de luz de mayo" />
                </div>
                <div className="form-group">
                  <label>Monto (S/)</label>
                  <input type="number" step="0.01" value={form.monto||''} onChange={e => setForm({...form,monto:e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Fecha del gasto</label>
                  <input type="date" value={form.fechaGasto||''} onChange={e => setForm({...form,fechaGasto:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>URL del comprobante <span className="label-hint">(opcional)</span></label>
                  <input value={form.comprobanteUrl||''} onChange={e => setForm({...form,comprobanteUrl:e.target.value})} placeholder="https://..." />
                </div>
              </div>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={!form.categoriaId||!form.descripcion||!form.monto||!form.fechaGasto}>
                {selected ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
