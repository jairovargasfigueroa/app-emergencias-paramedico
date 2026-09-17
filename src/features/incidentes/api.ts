import type { Atencion } from '@/features/atencion/api'
import { api, ErrorApi } from '@/shared/api/cliente'

export type EstadoIncidente = 'ACTIVO' | 'EN_ATENCION' | 'ATENDIDO' | 'FALSA_ALARMA' | 'ATENDIDO_EXTERNAMENTE' | 'CANCELADO'

/** Hijo de `/incidentes-abiertos` en Firebase: lo que se ve de un incidente antes de tomarlo (PB-03 R2). */
export type IncidenteAbierto = {
  id: number
  latitud: number
  longitud: number
  estado: EstadoIncidente
  fechaHoraCreacion: string
  /** Máximo reportado por sus alertas. No viene si ninguna lo reportó. */
  cantidadAfectados?: number
  descripciones: string[]
  unidadesAcudiendo: number
  actualizadoEn: string
}

/** `UnidadAcudiendoResponse` del backend. */
export type UnidadAcudiendo = {
  ambulanciaId: number
  placa: string
}

/** Contexto del 409 `INCIDENTE_YA_TOMADO`: lo necesario para decidir si sumarse (PB-04 R2). */
export type IncidenteYaTomado = {
  incidenteId: number
  cantidadAfectados: number | null
  unidadesAcudiendo: UnidadAcudiendo[]
}

/** La ambulancia no viaja en la petición: es la de la asignación vigente del paramédico (PB-04 R6). */
export const incidentesApi = {
  tomar: (paramedicoId: number, incidenteId: number) =>
    api.post<Atencion>(`/incidentes/${incidenteId}/tomar`, undefined, { usuarioId: paramedicoId }),
  sumarse: (paramedicoId: number, incidenteId: number) =>
    api.post<Atencion>(`/incidentes/${incidenteId}/sumarse`, undefined, { usuarioId: paramedicoId }),
}

/** Devuelve el contexto si el error es el 409 de "otra unidad ya acude"; si no, `null`. */
export function incidenteYaTomado(error: unknown): IncidenteYaTomado | null {
  if (error instanceof ErrorApi && error.codigo === 'INCIDENTE_YA_TOMADO') {
    return error.cuerpo as unknown as IncidenteYaTomado
  }
  return null
}
