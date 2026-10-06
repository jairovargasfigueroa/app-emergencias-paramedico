import { api, ErrorApi } from '@/shared/api/cliente'

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
  /** Persona atrapada. Llega desde `incident-summary.v2`. */
  | 'entrapment'
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

/**
 * Frase corta en estilo radio, para leer de un vistazo o en voz alta. El servicio ya las manda en este orden: qué
 * pasó, las personas, el peligro y lo crítico.
 */
export type TipoPuntoClave = 'what' | 'people' | 'hazard' | 'critical'

export type PuntoClave = {
  kind: TipoPuntoClave
  text: string
}

/**
 * `active`: el servicio lo da por vigente. `unconfirmed`: alguien lo mencionó y nadie dijo que terminó, pero el último
 * resumen no lo nombra; se muestra con la hora de su último reporte para que no desaparezca sin motivo.
 */
export type EstadoDelPeligro = 'active' | 'unconfirmed'

export type PeligroConEstado = {
  type: Peligro
  status: EstadoDelPeligro
  /** Cuándo llegó la última evidencia que lo nombra. `null` si sale de una alerta o no se sabe. */
  lastReportedAt: string | null
}

/** Un peligro que una fuente dice que terminó, con las fuentes que lo dicen. */
export type PeligroResuelto = {
  type: Peligro
  evidenceIds: number[]
  alertIds: number[]
}

/**
 * El objeto `summary` del servicio de análisis, tal como lo guarda y lo devuelve el backend. Los campos opcionales
 * llegan desde `incident-summary.v2`: los resúmenes v1 ya guardados no los traen, por eso se leen con `puntosClave` y
 * `estadosDePeligro`.
 */
export type ResumenIa = {
  summary: string
  keyPoints?: PuntoClave[]
  eventType: TipoEvento
  /** Rango de personas involucradas. `null` si no se sabe. */
  people: { min: number; max: number } | null
  hazards: Peligro[]
  hazardStates?: PeligroConEstado[]
  resolvedHazards?: PeligroResuelto[]
  findings: Afirmacion[]
  risks: Afirmacion[]
  severity: { level: NivelGravedad; basis: string[] }
  conflicts: Afirmacion[]
  limitations: string[]
}

export type Modalidad = 'IMAGEN' | 'AUDIO' | 'VIDEO'

export type EstadoEvidencia = 'PENDIENTE_SUBIDA' | 'SUBIDA' | 'ANALIZADA' | 'FALLIDA' | 'DESCARTADA'

/** Segundo del video y lo que pasa ahí. */
export type MarcaDelVideo = {
  segundo: number
  texto: string
}

/**
 * `EvidenciaDelIncidenteResponse` del backend: solo las subidas, analizadas o no. `transcripcion` llega en audio y
 * video, y `lineaDeTiempo` en video; las dos vienen nulas mientras no hay análisis o si el análisis no las trae.
 */
export type Evidencia = {
  evidenciaId: number
  alertaId: number
  modalidad: Modalidad
  estado: EstadoEvidencia
  transcripcion: string | null
  lineaDeTiempo: MarcaDelVideo[] | null
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

/** Los puntos clave del resumen. Un resumen v1 no los tiene: su texto completo queda como el único "qué pasó". */
export function puntosClave(resumen: ResumenIa): PuntoClave[] {
  const puntos = (resumen.keyPoints ?? []).filter((punto) => punto.text?.trim())
  if (puntos.length > 0) {
    return puntos
  }
  return resumen.summary?.trim() ? [{ kind: 'what', text: resumen.summary }] : []
}

/** Cada peligro con su estado. En un resumen v1 todos se toman como activos y sin hora de último reporte. */
export function estadosDePeligro(resumen: ResumenIa): PeligroConEstado[] {
  if (resumen.hazardStates) {
    return resumen.hazardStates
  }
  return resumen.hazards.map((peligro) => ({ type: peligro, status: 'active', lastReportedAt: null }))
}

export const resumenApi = {
  consultar: (incidenteId: number) => api.get<ResumenIncidente>(`/incidentes/${incidenteId}/resumen`),
}

/**
 * Código del 403 con que el backend niega el resumen y las URLs de las evidencias a quien no tiene una atención activa
 * en el incidente. No es una falla: se ve cuando la unidad lo atiende, así que no se reintenta ni se vuelve a pedir.
 */
export const SIN_ATENCION_EN_INCIDENTE = 'SIN_ATENCION_EN_INCIDENTE'

export function esSinAtencion(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 403 && error.codigo === SIN_ATENCION_EN_INCIDENTE
}
