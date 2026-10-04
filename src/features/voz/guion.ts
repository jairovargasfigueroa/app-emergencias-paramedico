import { puntosClave, type NivelGravedad, type ResumenIa, type TipoPuntoClave } from '@/features/resumen/api'

/** Siempre en el mismo orden, como lo pasa una operadora por radio: qué pasó, quiénes, el peligro y lo crítico. */
const ORDEN: Record<TipoPuntoClave, number> = { what: 0, people: 1, hazard: 2, critical: 3 }

/** `undetermined` no se dice: una gravedad sin determinar no ayuda a prepararse y suena a dato. */
const GRAVEDADES: Partial<Record<NivelGravedad, string>> = {
  high: 'alta',
  moderate: 'moderada',
  low: 'baja',
}

/**
 * El texto que se lee en voz alta, armado con los puntos clave y la gravedad, sin otra llamada a la IA:
 * "Atención, unidad 12. Choque de dos motos. Dos heridos; uno no se mueve. Precaución: sale humo de un auto.
 * Gravedad estimada alta." Una actualización empieza con "Actualización:" en lugar del saludo a la unidad.
 */
export function guionDeLectura(resumen: ResumenIa, { placa, actualizacion }: { placa: string; actualizacion: boolean }) {
  const puntos = [...puntosClave(resumen)].sort((a, b) => (ORDEN[a.kind] ?? 0) - (ORDEN[b.kind] ?? 0))
  const frases = [actualizacion ? 'Actualización:' : `Atención, unidad ${placa}.`]

  let conPrecaucion = false
  for (const punto of puntos) {
    const texto = conPuntoFinal(punto.text.trim())
    // "Precaución" una sola vez, delante del primer peligro: repetirla en cada uno le quita fuerza.
    if (punto.kind === 'hazard' && !conPrecaucion) {
      conPrecaucion = true
      frases.push(`Precaución: ${enMinuscula(texto)}`)
    } else {
      frases.push(texto)
    }
  }

  const gravedad = GRAVEDADES[resumen.severity.level]
  if (gravedad) {
    frases.push(`Gravedad estimada ${gravedad}.`)
  }
  return frases.join(' ')
}

function conPuntoFinal(texto: string): string {
  return /[.!?…]$/.test(texto) ? texto : `${texto}.`
}

/** "Sale humo" pasa a "sale humo" después de los dos puntos; una sigla como "GLP" queda como está. */
function enMinuscula(texto: string): string {
  const [primera = '', segunda = ''] = texto
  return segunda && segunda === segunda.toUpperCase() && segunda !== segunda.toLowerCase()
    ? texto
    : primera.toLowerCase() + texto.slice(1)
}
