import { api } from '@/shared/api/cliente'

export type EstadoAtencion =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'

export type MotivoCancelacion = 'AVERIA' | 'NO_SE_ENCONTRO_PACIENTE' | 'DESVIADA' | 'OTRO'

/** Cómo terminó una salida que no trasladó a nadie. El motivo decide con qué estado cierra el incidente. */
export type MotivoSinTraslado =
  | 'ATENDIDO_EN_EL_LUGAR'
  | 'PACIENTE_RECHAZO'
  | 'NO_HABIA_PACIENTE'
  | 'TRASLADO_POR_OTRO_MEDIO'
  | 'FALLECIDO'

/** `AtencionResponse` del backend. */
export type Atencion = {
  id: number
  incidenteId: number
  ambulanciaId: number
  placa: string
  estado: EstadoAtencion
  horaToma: string
  horaLlegada: string | null
  horaRecogida: string | null
  horaLlegadaHospital: string | null
  horaEntrega: string | null
  horaSinTraslado: string | null
  motivoSinTraslado: MotivoSinTraslado | null
  /** Cuándo quedó libre la unidad. Mientras sea `null`, sigue ocupada aunque el paciente ya esté entregado. */
  horaLiberacion: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSaludId: number | null
  destinoDescripcion: string | null
  /** Todos los que pidieron esta ambulancia retiraron su pedido: hay que decidir si seguir o volverse. */
  emisoresCancelaron: boolean
}

/** `CentroSaludResponse` del backend. */
export type CentroSalud = {
  id: number
  nombre: string
  direccion: string | null
}

export type Ubicacion = {
  latitud: number
  longitud: number
}

/** `DatosPacienteRequest` del backend. Los dos campos son opcionales (PB-05 R3). */
export type DatosPaciente = {
  nombrePaciente?: string
  documentoPaciente?: string
}

/** `EntregaRequest` del backend: la ubicación siempre; el centro y la descripción, si hay (R4). */
export type Entrega = Ubicacion & {
  centroSaludId?: number
  destinoDescripcion?: string
}

export const atencionApi = {
  /** Devuelve `undefined` (204) si la ambulancia del paramédico no tiene una atención activa. */
  activa: (signal?: AbortSignal) => api.get<Atencion | undefined>('/paramedicos/actual/atencion', { signal }),
  marcarLlegada: (atencionId: number, ubicacion: Ubicacion) =>
    api.post<Atencion>(`/atenciones/${atencionId}/llegada`, ubicacion),
  marcarRecogida: (atencionId: number, datos: Ubicacion & DatosPaciente) =>
    api.post<Atencion>(`/atenciones/${atencionId}/recogida`, datos),
  marcarLlegadaAlHospital: (atencionId: number, ubicacion: Ubicacion) =>
    api.post<Atencion>(`/atenciones/${atencionId}/hospital`, ubicacion),
  entregar: (atencionId: number, datos: Entrega) => api.post<Atencion>(`/atenciones/${atencionId}/entrega`, datos),
  /** La salida que no trasladó a nadie: no es una cancelación, la unidad fue y resolvió. */
  cerrarSinTraslado: (atencionId: number, datos: Ubicacion & { motivo: MotivoSinTraslado }) =>
    api.post<Atencion>(`/atenciones/${atencionId}/sin-traslado`, datos),
  /** La unidad queda libre. Hasta acá sigue ocupada, aunque el paciente ya esté entregado. */
  liberar: (atencionId: number) => api.post<Atencion>(`/atenciones/${atencionId}/liberacion`),
  cancelar: (atencionId: number, motivo: MotivoCancelacion) =>
    api.post<Atencion>(`/atenciones/${atencionId}/cancelar`, { motivo }),
  actualizarPaciente: (atencionId: number, datos: DatosPaciente) =>
    api.post<Atencion>(`/atenciones/${atencionId}/paciente`, datos),
  centrosSalud: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', { signal }),
}
