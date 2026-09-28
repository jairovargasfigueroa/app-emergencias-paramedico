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

/** "12:05", "0:42": lo que falta hasta una fecha ISO, para una cuenta regresiva que avanza de a segundo. */
export function tiempoRestante(hastaIso: string, ahora: number = Date.now()): string {
  const segundos = Math.max(0, Math.ceil((new Date(hastaIso).getTime() - ahora) / 1000))
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
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

/**
 * "47 min", "1 h 05 min": lo que pasó entre dos hitos ya cerrados. No sirve `duracionDesde`, que a partir de la
 * hora tira los minutos: en un viaje terminado la diferencia entre "1 h" y "1 h 50 min" es justo lo que se mira.
 */
export function duracionEntre(desdeIso: string, hastaIso: string): string {
  const minutos = Math.max(0, Math.round((new Date(hastaIso).getTime() - new Date(desdeIso).getTime()) / 60_000))
  if (minutos < 1) {
    return 'menos de 1 min'
  }
  if (minutos < 60) {
    return `${minutos} min`
  }
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
}

/**
 * "Hoy 14:32", "Ayer 09:15", "12 sep 14:32". En una lista de viajes pasados la fecha completa es ruido: lo que se
 * busca es si fue hoy, ayer o hace tiempo.
 */
export function fechaNatural(iso: string, ahora: number = Date.now()): string {
  const fecha = new Date(iso)
  const dias = diasDeDiferencia(fecha, new Date(ahora))
  if (dias === 0) {
    return `Hoy ${horaCorta(iso)}`
  }
  if (dias === 1) {
    return `Ayer ${horaCorta(iso)}`
  }
  return `${fecha.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })} ${horaCorta(iso)}`
}

/** Días de calendario entre dos fechas, no ventanas de 24 h: a las 00:30 lo de las 23:50 fue ayer, no hace un rato. */
function diasDeDiferencia(fecha: Date, ahora: Date): number {
  const medianoche = (dia: Date) => new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime()
  return Math.round((medianoche(ahora) - medianoche(fecha)) / 86_400_000)
}
