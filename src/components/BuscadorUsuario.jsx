import { useState, useRef, useEffect } from 'react'
import './BuscadorUsuario.css'

const IcoSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoX      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoChev   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>

// Buscador de usuarios por texto libre (nombre, apellido, DNI o correo) —
// reemplaza al <select> nativo, que con muchos usuarios se vuelve enorme
// y difícil de usar, sobre todo en celular sin teclado físico.
export default function BuscadorUsuario({ usuarios, value, onChange, placeholder = 'Buscar por nombre, DNI o correo...' }) {
  const [query,   setQuery]   = useState('')
  const [abierto, setAbierto] = useState(false)
  const wrapRef = useRef()

  const seleccionado = usuarios.find(u => String(u.id) === String(value))

  useEffect(() => {
    const cerrarSiFuera = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', cerrarSiFuera)
    return () => document.removeEventListener('mousedown', cerrarSiFuera)
  }, [])

  const filtrados = (query.trim()
    ? usuarios.filter(u => `${u.nombre} ${u.apellido} ${u.dni || ''} ${u.email || ''}`.toLowerCase().includes(query.toLowerCase()))
    : usuarios
  ).slice(0, 8)

  const seleccionar = (u) => {
    onChange(String(u.id))
    setQuery('')
    setAbierto(false)
  }

  // Ya hay alguien elegido y el buscador está cerrado: muestra la tarjeta compacta
  if (seleccionado && !abierto) {
    return (
      <button type="button" className="bu-seleccionado" onClick={() => setAbierto(true)}>
        <div className="bu-sel-avatar">{seleccionado.nombre[0]}{seleccionado.apellido[0]}</div>
        <div className="bu-sel-info">
          <p className="bu-sel-nombre">{seleccionado.nombre} {seleccionado.apellido}</p>
          <p className="bu-sel-meta">{seleccionado.dni ? `DNI ${seleccionado.dni}` : (seleccionado.email || 'Sin más datos')}</p>
        </div>
        <span className="bu-btn-cambiar"><IcoChev /> Cambiar</span>
      </button>
    )
  }

  return (
    <div className="bu-wrap" ref={wrapRef}>
      <div className="bu-input-wrap">
        <IcoSearch />
        <input
          className="bu-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          placeholder={placeholder}
        />
        {query && <button type="button" className="bu-btn-clear" onClick={() => setQuery('')}><IcoX /></button>}
      </div>
      {abierto && (
        <div className="bu-lista">
          {filtrados.length === 0 && <p className="bu-sin-resultados">Sin resultados</p>}
          {filtrados.map(u => (
            <button type="button" key={u.id} className="bu-item" onClick={() => seleccionar(u)}>
              <div className="bu-item-avatar">{u.nombre[0]}{u.apellido[0]}</div>
              <div className="bu-item-info">
                <p className="bu-item-nombre">{u.nombre} {u.apellido}</p>
                <p className="bu-item-meta">
                  {u.dni ? `DNI ${u.dni}` : ''}{u.dni && u.email ? ' · ' : ''}{u.email || ''}
                </p>
              </div>
            </button>
          ))}
          {usuarios.length > 8 && !query && (
            <p className="bu-hint-mas">Sigue escribiendo para encontrar a alguien más específico...</p>
          )}
        </div>
      )}
    </div>
  )
}
