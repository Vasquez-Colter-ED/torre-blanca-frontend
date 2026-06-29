import { useRef } from 'react'
import './ReciboDetalle.css'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const METODO_LABEL = {
  TRANSFERENCIA:'Transferencia bancaria', DEPOSITO:'Depósito bancario',
  PLIN:'Plin', EFECTIVO:'Efectivo', OTRO:'Otro método',
  TARJETA:'Tarjeta de crédito/débito', TRANSFERENCIA_MP:'Tarjeta (Mercado Pago)'
}

export default function ReciboDetalle({ boleta, anio, onCerrar }) {
  const ref = useRef()

  const descargar = async () => {
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF }       = await import('jspdf')

    const canvas = await html2canvas(ref.current, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff',
      logging: false,
    })

    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const img  = canvas.toDataURL('image/png')
    const pw   = pdf.internal.pageSize.getWidth()
    const ph   = pdf.internal.pageSize.getHeight()
    const cw   = canvas.width
    const ch   = canvas.height
    const ratio = pw / cw
    const ih   = Math.min(ch * ratio, ph)

    pdf.addImage(img, 'PNG', 0, 0, pw, ih)
    pdf.save(`Recibo-TorreBlanca-${MESES[boleta.mes-1]}-${anio}.pdf`)
  }

  const numeroRecibo = boleta.numeroBoleta || String(boleta.id || 0).padStart(6, '0')
  const fechaPago    = boleta.fechaPago ? new Date(boleta.fechaPago) : new Date()
  const fechaStr     = fechaPago.toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })

  return (
    <div className="rd-overlay">
      {/* Toolbar fuera del área imprimible */}
      <div className="rd-toolbar">
        <span className="rd-toolbar-titulo">Vista previa del recibo</span>
        <div className="rd-toolbar-acciones">
          <button className="rd-btn-descargar" onClick={descargar}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </button>
          <button className="rd-btn-cerrar" onClick={onCerrar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Área del recibo — esto se convierte en PDF */}
      <div className="rd-paper-wrap">
        <div className="rd-paper" ref={ref}>

          {/* Encabezado */}
          <div className="rd-header">
            <div className="rd-header-left">
              <div className="rd-logo-wrap">
                <img src="/logo-base.png" alt="Torre Blanca" className="rd-logo" />
              </div>
              <div className="rd-brand">
                <p className="rd-brand-nombre">Torre Blanca</p>
                <p className="rd-brand-sub">Residencial · Chiclayo, Perú</p>
              </div>
            </div>
            <div className="rd-header-right">
              <p className="rd-recibo-label">RECIBO DE PAGO</p>
              <p className="rd-recibo-num">N° {numeroRecibo}</p>
            </div>
          </div>

          <div className="rd-divider" />

          {/* Info del residente y fecha */}
          <div className="rd-info-row">
            <div className="rd-info-bloque">
              <p className="rd-info-lbl">Residente</p>
              <p className="rd-info-val rd-nombre">{boleta.pagadorNombre}</p>
              <p className="rd-info-sub">Depto {boleta.numeroDepartamento} · Piso {boleta.piso}</p>
            </div>
            <div className="rd-info-bloque rd-info-bloque-der">
              <p className="rd-info-lbl">Fecha de emisión</p>
              <p className="rd-info-val">{fechaStr}</p>
              <div className="rd-estado-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Verificado
              </div>
            </div>
          </div>

          {/* Tabla de detalle */}
          <div className="rd-tabla">
          <div className="rd-tabla-head">
          <span>Descripción</span>
          <span>Período</span>
          <span>Monto</span>
          </div>
          <div className="rd-tabla-row">
          <span className="rd-tabla-desc">Cuota de mantenimiento mensual</span>
          <span className="rd-tabla-periodo">{MESES[boleta.mes-1]} {anio}</span>
          <span className="rd-tabla-monto">S/ {Number(boleta.monto).toFixed(2)}</span>
          </div>
            {boleta.comision > 0 && (
                <div className="rd-tabla-row rd-tabla-row-comision">
                  <span className="rd-tabla-desc rd-tabla-desc-comision">Comisión pasarela de pago <span className="rd-comision-tasa">(Mercado Pago · 3.99% + S/ 0.30)</span></span>
                  <span className="rd-tabla-periodo"></span>
                  <span className="rd-tabla-monto rd-tabla-monto-comision">S/ {Number(boleta.comision).toFixed(2)}</span>
                </div>
              )}
            </div>

          {/* Total */}
          <div className="rd-total-row">
            <span className="rd-total-lbl">Total pagado</span>
            <span className="rd-total-val">S/ {(Number(boleta.monto) + Number(boleta.comision || 0)).toFixed(2)}</span>
          </div>

          {/* Método de pago y operación */}
          <div className="rd-pago-detalle">
            <div className="rd-pago-item">
              <span className="rd-pago-lbl">Método de pago</span>
              <span className="rd-pago-val">{METODO_LABEL[boleta.metodoPago] || boleta.metodoPago || '—'}</span>
            </div>
            {boleta.numeroOperacion && (
              <div className="rd-pago-item">
                <span className="rd-pago-lbl">N° de operación</span>
                <span className="rd-pago-val rd-codigo">{boleta.numeroOperacion}</span>
              </div>
            )}
          </div>

          {/* Voucher si existe */}
          {boleta.voucherUrl && (
            <div className="rd-voucher-sec">
              <p className="rd-voucher-lbl">Comprobante adjunto</p>
              <img src={boleta.voucherUrl} alt="Voucher" className="rd-voucher-img" crossOrigin="anonymous" />
            </div>
          )}

          {/* Pie de página */}
          <div className="rd-footer">
            <div className="rd-footer-linea" />
            <p className="rd-footer-txt">
              Este documento es un comprobante interno de pago emitido por la administración de
              Residencial Torre Blanca. No tiene validez tributaria ante SUNAT.
            </p>
            <p className="rd-footer-marca">Residencial Torre Blanca · Chiclayo, Perú</p>
          </div>

        </div>
      </div>
    </div>
  )
}
