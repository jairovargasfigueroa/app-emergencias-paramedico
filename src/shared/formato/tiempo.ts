/** "40 s", "4 min", "2 h" desde una fecha ISO hasta `ahora`. */
export function duracionDesde(iso: string, ahora: number = Date.now()): string {
  const segundos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000))
  if (segundos < 60) {
    return `${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `${minutos} min`
  }
  return `${Math.floor(minutos / 60)} h`
}

/** "40 segundos", "1 minuto", "12 minutos", "2 horas": para frases donde la abreviatura se lee mal. */
export function duracionLarga(iso: string, ahora: number = Date.now()): string {
  const segundos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000))
  if (segundos < 60) {
    return segundos === 1 ? '1 segundo' : `${segundos} segundos`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return minutos === 1 ? '1 minuto' : `${minutos} minutos`
  }
  const horas = Math.floor(minutos / 60)
  return horas === 1 ? '1 hora' : `${horas} horas`
}

/** "hace 40 s", "hace 4 min", "hace 2 h" desde una fecha ISO hasta `ahora`. */
export function tiempoTranscurrido(iso: string, ahora: number = Date.now()): string {
  return `hace ${duracionDesde(iso, ahora)}`
}

/** "14:36" en la hora local del teléfono. */
export function horaCorta(iso: string): string {
  const fecha = new Date(iso)
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}
