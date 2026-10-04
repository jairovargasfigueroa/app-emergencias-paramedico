import { horaCorta } from '@/shared/formato/tiempo'

import type { Evidencia, Modalidad, NivelGravedad, Peligro, PeligroConEstado, ResumenIa, TipoEvento } from './api'

const TIPOS_EVENTO: Record<TipoEvento, string> = {
  traffic_accident: 'Accidente de tránsito',
  fire: 'Incendio',
  explosion: 'Explosión',
  medical_emergency: 'Emergencia médica',
  fall_or_injury: 'Caída o lesión',
  violence: 'Violencia',
  drowning_or_flood: 'Ahogamiento o inundación',
  structural_collapse: 'Derrumbe',
  hazardous_material: 'Material peligroso',
  other: 'Otro tipo de emergencia',
  undetermined: 'Tipo sin determinar',
}

const PELIGROS: Record<Peligro, string> = {
  fire: 'Fuego',
  smoke: 'Humo',
  traffic: 'Tránsito',
  electrical: 'Electricidad',
  gas_or_chemical: 'Gas o químicos',
  structural_instability: 'Estructura inestable',
  water: 'Agua',
  weapon_or_violence: 'Armas o violencia',
  crowd: 'Aglomeración',
  height: 'Altura',
  entrapment: 'Persona atrapada',
  other: 'Otro peligro',
}

const GRAVEDADES: Record<NivelGravedad, string> = {
  high: 'Gravedad alta',
  moderate: 'Gravedad moderada',
  low: 'Gravedad baja',
  undetermined: 'Gravedad sin determinar',
}

// Si el servicio agrega un valor nuevo antes que la app, se muestra como "otro" y no como texto en inglés.
export function textoTipoEvento(tipo: string): string {
  return TIPOS_EVENTO[tipo as TipoEvento] ?? TIPOS_EVENTO.other
}

export function textoPeligro(peligro: string): string {
  return PELIGROS[peligro as Peligro] ?? PELIGROS.other
}

export function textoGravedad(nivel: string): string {
  return GRAVEDADES[nivel as NivelGravedad] ?? GRAVEDADES.undetermined
}

/** "2 personas", "1 a 3 personas", "Hasta 2 personas". */
export function textoPersonas(personas: ResumenIa['people']): string {
  if (!personas) {
    return 'No se sabe cuántas personas'
  }
  const { min, max } = personas
  if (max === 0) {
    return 'No se ven personas involucradas'
  }
  if (min === max) {
    return max === 1 ? '1 persona' : `${max} personas`
  }
  if (min === 0) {
    return max === 1 ? 'Hasta 1 persona' : `Hasta ${max} personas`
  }
  return `${min} a ${max} personas`
}

/** "Corroborado por 3 alertas": cuántos reportes distintos lo respaldan. */
export function textoCorroboracion(alertas: number): string {
  return alertas === 1 ? 'Corroborado por 1 alerta' : `Corroborado por ${alertas} alertas`
}

/** "Humo · último reporte 10:32": un peligro que nadie dio por terminado, aunque el último resumen ya no lo nombra. */
export function textoPeligroSinConfirmar(peligro: PeligroConEstado): string {
  const cuando = peligro.lastReportedAt ? `último reporte ${horaCorta(peligro.lastReportedAt)}` : 'sin novedades'
  return `${textoPeligro(peligro.type)} · ${cuando}`
}

const ARCHIVOS: Record<Modalidad, [string, string]> = {
  IMAGEN: ['foto', 'fotos'],
  AUDIO: ['audio', 'audios'],
  VIDEO: ['video', 'videos'],
}

/** "2 fotos · 1 audio": cuántos archivos mandaron, sin decir nada de lo que tienen. Vacío si no hay ninguno. */
export function textoEvidencias(evidencias: Evidencia[]): string {
  return (Object.keys(ARCHIVOS) as Modalidad[])
    .map((modalidad) => {
      const cantidad = evidencias.filter((evidencia) => evidencia.modalidad === modalidad).length
      const [singular, plural] = ARCHIVOS[modalidad]
      return cantidad === 0 ? null : `${cantidad} ${cantidad === 1 ? singular : plural}`
    })
    .filter(Boolean)
    .join(' · ')
}
