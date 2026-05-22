import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Departamentos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

export default function Departamentos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  const [deptos,   setDeptos]   = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(null)
  const [form,     setForm]     = useState({})
  const [msg,      setMsg]      = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [d, u] = await Promise.all([
        api.get('/api/departamentos'),
        esDirectivo ? api.get('/api/usuarios') : Promise.resolve({ data: [] })
      ])
      setDeptos(d.data); setUsuarios(u.data)
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const cerrar = () => { setModal(null); setSelected(null); setMsg(''); setError('') }

  const guardarPropietario = async () => {
    try {
      const res = await api.post('/api/departamentos/asignar-propietario', { usuarioId: Number(form.usuarioId), departamentoId: selected.id })
      setMsg(res.data.mensaje); cargarDatos(); setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const guardarInquilino = async () => {
    try {
      const res = await api.post('/api/departamentos/asignar-inquilino', { usuarioId: Number(form.usuarioId), departamentoId: selected.id, propietarioId: Number(form.propietarioId) })
      setMsg(res.data.mensaje); cargarDatos(); setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const quitarInquilino = async (asignacionId, nombre) => {
    if (!confirm(`¿Quitar a ${nombre} del departamento?`)) return
    try { await api.delete(`/api/departamentos/inquilino/${asignacionId}`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const filtrados = deptos.filter(d =>
    d.numero.includes(busqueda) || (d.propietarioNombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <div className="loading-msg">Cargando departamentos...</div>

  return (
    <div className="deptos-page">
      <h1 className="page-title">Departamentos</h1>
      <p className="page-subtitle">Los 32 departamentos de Torre Blanca y sus residentes</p>
      <div className="deptos-toolbar">
        <input className="search-input" placeholder="Buscar por número o propietario..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <span className="deptos-count">{filtrados.length} departamentos</span>
      </div>
      {error && <div className="alert-error">{error}</div>}

      {[1,2,3,4,5,6,7,8].map(piso => {
        const deptosPiso = filtrados.filter(d => d.piso === piso)
        if (deptosPiso.length === 0) return null
        return (
          <div key={piso} className="piso-section">
            <div className="piso-header">Piso {piso}</div>
            <div className="deptos-grid">
              {deptosPiso.map(d => (
                <div key={d.id} className={`depto-card ${d.propietarioNombre ? '' : 'depto-vacio'}`}>
                  <div className="depto-top">
                    <span className="depto-numero">{d.numero}</span>
                    <span className="depto-m2">{d.metrosCuadrados} m²</span>
                  </div>
                  {d.propietarioNombre
                    ? <div className="residente-item"><span className="residente-tipo">Propietario</span><span className="residente-nombre">{d.propietarioNombre}</span></div>
                    : <div className="sin-propietario">Sin propietario</div>
                  }
                  {d.inquilinos?.map(inq => (
                    <div key={inq.asignacionId} className="residente-item residente-inq">
                      <div className="residente-inq-info">
                        <span className="residente-tipo">Inquilino</span>
                        <span className="residente-nombre">{inq.nombre}</span>
                      </div>
                      {esDirectivo && (
                        <button className="btn-quitar-inq" onClick={() => quitarInquilino(inq.asignacionId, inq.nombre)} title="Quitar inquilino">✕</button>
                      )}
                    </div>
                  ))}
                  {esDirectivo && (
                    <div className="depto-actions">
                      <button className="btn btn-ghost btn-xs" onClick={() => { setSelected(d); setForm({ usuarioId: '' }); setModal('propietario'); setMsg(''); setError('') }}>
                        {d.propietarioNombre ? 'Cambiar propietario' : 'Asignar propietario'}
                      </button>
                      {d.propietarioId && (
                        <button className="btn btn-ghost btn-xs" onClick={() => { setSelected(d); setForm({ usuarioId: '', propietarioId: d.propietarioId || '' }); setModal('inquilino'); setMsg(''); setError('') }}>
                          + Inquilino
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {modal === 'propietario' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Asignar propietario</h3>
            <p className="modal-sub">Departamento <strong>{selected?.numero}</strong></p>
            {selected?.propietarioNombre && <p className="modal-warning">Propietario actual: {selected.propietarioNombre}. Será reemplazado.</p>}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Selecciona el propietario</label>
              <select value={form.usuarioId} onChange={e => setForm({...form, usuarioId: e.target.value})}>
                <option value="">-- Elige un usuario --</option>
                {usuarios.filter(u => u.estado === 'ACTIVO').map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido} — {u.email}</option>
                ))}
              </select>
            </div>
            {msg && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPropietario} disabled={!form.usuarioId}>Asignar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'inquilino' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Agregar inquilino</h3>
            <p className="modal-sub">Departamento <strong>{selected?.numero}</strong></p>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Selecciona el inquilino</label>
              <select value={form.usuarioId} onChange={e => setForm({...form, usuarioId: e.target.value})}>
                <option value="">-- Elige un usuario --</option>
                {usuarios.filter(u => u.estado === 'ACTIVO').map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido} — {u.email}</option>
                ))}
              </select>
            </div>
            {msg && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarInquilino} disabled={!form.usuarioId}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
