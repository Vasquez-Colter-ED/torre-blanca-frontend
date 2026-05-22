import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Boletas.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Boletas() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [boletas,    setBoletas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroMes,  setFiltroMes]  = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [selected,   setSelected]   = useState(null)
  const [error,      setError]      = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/boletas')
      setBoletas(res.data)
    } catch { setError('Error al cargar boletas') }
    finally { setLoading(false) }
  }

  const filtradas = boletas.filter(b => {
    if (filtroMes  && b.mes  !== Number(filtroMes))  return false
    if (filtroAnio && b.anio !== Number(filtroAnio)) return false
    return true
  })

  if (loading) return <div className="loading-msg">Cargando boletas...</div>

  return (
    <div className="boletas-page">
      <h1 className="page-title">Boletas</h1>
      <p className="page-subtitle">
        {esDirectivo ? 'Historial de boletas emitidas' : 'Mis boletas de mantenimiento'}
      </p>

      <div className="boletas-toolbar">
        <select className="mes-select" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="mes-select" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="boletas-count">{filtradas.length} boleta{filtradas.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {filtradas.length === 0 && (
        <div className="empty-state">No hay boletas para el período seleccionado.</div>
      )}

      <div className="boletas-lista">
        {filtradas.map(b => (
          <div key={b.id} className="boleta-card" onClick={() => setSelected(b)}>
            <div className="boleta-icon">B</div>
            <div className="boleta-info">
              <p className="boleta-numero">{b.numeroBoleta}</p>
              <p className="boleta-periodo">{MESES[b.mes-1]} {b.anio} · Depto {b.numeroDepartamento}</p>
              <p className="boleta-pagador">{b.pagadorNombre}</p>
            </div>
            <div className="boleta-right">
              <p className="boleta-monto">S/ {Number(b.monto).toFixed(2)}</p>
              <p className="boleta-metodo">{b.metodoPago}</p>
              <p className="boleta-fecha">{b.fechaEmision ? new Date(b.fechaEmision).toLocaleDateString('es-PE') : '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal detalle boleta */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box glass boleta-detalle" onClick={e => e.stopPropagation()}>
            <div className="boleta-det-header">
              <div>
                <h2 className="boleta-det-titulo">Torre Blanca</h2>
                <p className="boleta-det-sub">Residencial · Chiclayo, Perú</p>
              </div>
              <div className="boleta-det-numero">{selected.numeroBoleta}</div>
            </div>

            <div className="boleta-det-divider" />

            <div className="boleta-det-grid">
              <div className="boleta-det-item"><span className="det-label">Residente</span><span className="det-valor">{selected.pagadorNombre}</span></div>
              <div className="boleta-det-item"><span className="det-label">Departamento</span><span className="det-valor">{selected.numeroDepartamento} · Piso {selected.piso}</span></div>
              <div className="boleta-det-item"><span className="det-label">Período</span><span className="det-valor">{MESES[selected.mes-1]} {selected.anio}</span></div>
              <div className="boleta-det-item"><span className="det-label">Método de pago</span><span className="det-valor">{selected.metodoPago}</span></div>
              {selected.numeroOperacion && <div className="boleta-det-item"><span className="det-label">N° operación</span><span className="det-valor">{selected.numeroOperacion}</span></div>}
              <div className="boleta-det-item"><span className="det-label">Fecha de pago</span><span className="det-valor">{selected.fechaPago ? new Date(selected.fechaPago).toLocaleDateString('es-PE') : '—'}</span></div>
              <div className="boleta-det-item"><span className="det-label">Fecha emisión</span><span className="det-valor">{selected.fechaEmision ? new Date(selected.fechaEmision).toLocaleDateString('es-PE') : '—'}</span></div>
              {selected.emitidaPorNombre && <div className="boleta-det-item"><span className="det-label">Emitida por</span><span className="det-valor">{selected.emitidaPorNombre}</span></div>}
            </div>

            <div className="boleta-det-divider" />

            <div className="boleta-det-total">
              <span>Total pagado</span>
              <span className="boleta-det-monto">S/ {Number(selected.monto).toFixed(2)}</span>
            </div>

            <div className="boleta-det-footer">
              <p>Documento emitido por el sistema de administración Torre Blanca</p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
