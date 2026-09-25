import { api } from '@/shared/api/cliente'

export type EstadoAtencion =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'

export type MotivoCancelacion =
  | 'AVERIA'
  | 'NO_SE_ENCONTRO_PACIENTE'
  | 'DESVIADA'
  | 'RECHAZADA_POR_PARAMEDICO'
  | 'CANCELADA_POR_SOLICITANTE'
  | 'OTRO'

/** Cómo terminó una salida que no trasladó a nadie. El motivo decide con qué estado cierra el incidente. */
export type MotivoSinTraslado =
  | 'ATENDIDO_EN_EL_LUGAR'
  | 'PACIENTE_RECHAZO'
  | 'NO_HABIA_PACIENTE'
  | 'TRASLADO_POR_OTRO_MEDIO'
  | 'FALLECIDO'
  | 'PACIENTE_NO_LISTO'
  | 'UNIDAD_NO_CORRESPONDE'

export type Movilidad = 'CAMINA_CON_AYUDA' | 'SILLA_DE_RUEDAS' | 'CAMILLA'

export type TipoUnidad = 'IA' | 'IB' | 'II' | 'III'

/**
 * `TrasladoResponse` del backend: todo lo que el paramédico necesita saber antes de salir. Viene dentro de la
 * atención cuando el trabajo es un traslado y no una emergencia.
 */
export type TrasladoDeAtencion = {
  id: number
  pasajero: string
  movilidad: Movilidad
  oxigeno: boolean
  equipo: boolean
  aislamiento: boolean
  pesoAproximado: number | null
  acompanantes: number
  observaciones: string | null
  tipoUnidad: TipoUnidad
  origen: Ubicacion
  origenReferencia: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  destino: Ubicacion
  centroSaludDestino: string | null
  destinoDetalle: string | null
  horaCita: string | null
}

/** `AtencionResponse` del backend. Cuelga de un incidente o de un traslado, nunca de los dos. */
export type Atencion = {
  id: number
  /** Nulo cuando la atención es un traslado. */
  incidenteId: number | null
  /** Nulo cuando la atención viene de una emergencia. */
  traslado: TrasladoDeAtencion | null
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
  /** Solo en traslados: llegó y el paciente no estaba listo. */
  horaAvisoNoListo: string | null
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
  /** Solo en traslados: queda la hora de llegada y la espera, que es tiempo de unidad que la empresa paga. */
  marcarPacienteNoListo: (atencionId: number) => api.post<Atencion>(`/atenciones/${atencionId}/no-listo`),
  /**
   * Solo en traslados: el paciente no está como decía la ficha. El paramédico corrige lo que ve y el sistema
   * vuelve a derivar el tipo de unidad, así el pedido no regresa pidiendo la misma que acaba de fallar.
   */
  unidadNoCorresponde: (
    atencionId: number,
    datos: Ubicacion & { movilidad: Movilidad; oxigeno: boolean; equipo: boolean },
  ) => api.post<Atencion>(`/atenciones/${atencionId}/unidad-no-corresponde`, datos),
  centrosSalud: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', { signal }),
}
