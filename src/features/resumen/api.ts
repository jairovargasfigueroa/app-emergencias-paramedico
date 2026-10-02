import { api } from '@/shared/api/cliente'

/** Vocabularios cerrados del servicio de análisis. Llegan en inglés: los nombres en español están en `textos.ts`. */
export type TipoEvento =
  | 'traffic_accident'
  | 'fire'
  | 'explosion'
  | 'medical_emergency'
  | 'fall_or_injury'
  | 'violence'
  | 'drowning_or_flood'
  | 'structural_collapse'
  | 'hazardous_material'
  | 'other'
  | 'undetermined'

export type Peligro =
  | 'fire'
  | 'smoke'
  | 'traffic'
  | 'electrical'
  | 'gas_or_chemical'
  | 'structural_instability'
  | 'water'
  | 'weapon_or_violence'
  | 'crowd'
  | 'height'
  | 'other'

/** `undetermined` no es "leve": la IA no tuvo con qué justificar una gravedad. */
export type NivelGravedad = 'low' | 'moderate' | 'high' | 'undetermined'

/** `observed` lo vio o lo oyó en una evidencia; `inferred` lo dedujo. */
export type Base = 'observed' | 'inferred'

/**
 * Hallazgo, riesgo o contradicción con sus fuentes. `corroboratingAlerts` cuenta alertas distintas que lo respaldan:
 * lo calcula el código del servicio, no el modelo, y reemplaza a una confianza numérica.
 */
export type Afirmacion = {
  text: string
  evidenceIds: number[]
  alertIds: number[]
  corroboratingAlerts: number
  /** Solo en los hallazgos. */
  basis?: Base
}

/** El objeto `summary` del servicio de análisis, tal como lo guarda y lo devuelve el backend. */
export type ResumenIa = {
  summary: string
  eventType: TipoEvento
  /** Rango de personas involucradas. `null` si no se sabe. */
  people: { min: number; max: number } | null
  hazards: Peligro[]
  findings: Afirmacion[]
  risks: Afirmacion[]
  severity: { level: NivelGravedad; basis: string[] }
  conflicts: Afirmacion[]
  limitations: string[]
}

export type Modalidad = 'IMAGEN' | 'AUDIO' | 'VIDEO'

export type EstadoEvidencia = 'PENDIENTE_SUBIDA' | 'SUBIDA' | 'ANALIZADA' | 'FALLIDA' | 'DESCARTADA'

/** `EvidenciaResponse` del backend: solo las subidas, analizadas o no. */
export type Evidencia = {
  evidenciaId: number
  alertaId: number
  modalidad: Modalidad
  estado: EstadoEvidencia
}

/**
 * `ResumenIncidenteResponse` del backend. Mientras la IA no armó ningún resumen, `version` y `resumen` vienen nulos
 * y las evidencias se ven igual.
 */
export type ResumenIncidente = {
  incidenteId: number
  version: number | null
  resumen: ResumenIa | null
  evidenciasUsadas: number[]
  alertasUsadas: number[]
  metodo: string | null
  modelo: string | null
  versionPrompt: string | null
  generadoEn: string | null
  evidencias: Evidencia[]
}

export const resumenApi = {
  consultar: (incidenteId: number) => api.get<ResumenIncidente>(`/incidentes/${incidenteId}/resumen`),
}
