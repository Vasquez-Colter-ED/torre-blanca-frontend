import { useState } from 'react'
import './TelefonoInput.css'

// Bandera de Perú en SVG (no emoji) — 3 franjas rojo-blanco-rojo
const IcoFlagPE = () => (
  <svg width="18" height="13" viewBox="0 0 18 13" className="tel-flag-svg">
    <rect width="18" height="13" fill="#fff"/>
    <rect width="6" height="13" fill="#D91023"/>
    <rect x="12" width="6" height="13" fill="#D91023"/>
  </svg>
)

// Input de teléfono: código de país editable (+51 por defecto, con bandera)
// + número. Se guardan SIEMPRE separados por un espacio ("+51 987654321"),
// nunca pegados — así no hay ambigüedad de dónde termina el código de país
// al volver a leerlo (los códigos válidos van de 1 a 4 dígitos).
export default function TelefonoInput({ value, onChange }) {
  const parseInicial = () => {
    if (!value) return { cod: '+51', num: '' }
    if (value.includes(' ')) {
      const [cod, ...resto] = value.trim().split(' ')
      return { cod, num: resto.join('').replace(/\D/g, '') }
    }
    // Valor viejo guardado sin espacio ni código (formatos antiguos, antes
    // de tener prefijo de país) — se asume +51 para poder editarlo,
    // pero la vista de solo-lectura en otros lados sigue mostrando el
    // valor original tal cual, sin tocarlo.
    if (value.startsWith('+51')) return { cod: '+51', num: value.slice(3) }
    return { cod: '+51', num: value.replace(/\D/g, '') }
  }
  const [tel, setTel] = useState(parseInicial)

  const actualizar = (cod, num) => {
    setTel({ cod, num })
    onChange(num ? `${cod} ${num}` : '') // sin número, no se manda solo el código
  }

  const handleCod = (v) => {
    let limpio = '+' + v.replace(/[^\d]/g, '') // siempre empieza con +, solo dígitos después
    actualizar(limpio.slice(0, 5), tel.num)
  }

  // Perú (+51) siempre son 9 dígitos; para cualquier otro código de país
  // dejamos un rango más amplio (6 a 12), ya que varía según el país
  const esPeru = tel.cod === '+51'
  const maxDigitos = esPeru ? 9 : 12

  return (
    <div className="tel-wrap">
      <div className="tel-cod-wrap">
        {esPeru && <span className="tel-flag"><IcoFlagPE /></span>}
        <input className="tel-cod" value={tel.cod} onChange={e => handleCod(e.target.value)}
          maxLength={5} placeholder="+51" />
      </div>
      <input className="tel-num" value={tel.num}
        onChange={e => actualizar(tel.cod, e.target.value.replace(/\D/g, '').slice(0, maxDigitos))}
        placeholder={esPeru ? '987654321' : 'Número'} inputMode="numeric" />
    </div>
  )
}
