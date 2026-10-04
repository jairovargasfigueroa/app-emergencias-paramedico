import type { NivelGravedad, Peligro, ResumenIa, TipoEvento } from './api'

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
