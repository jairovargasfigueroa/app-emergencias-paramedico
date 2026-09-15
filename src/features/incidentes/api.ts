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
