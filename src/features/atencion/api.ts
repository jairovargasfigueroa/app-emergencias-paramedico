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
  /** Solo en traslados: la unidad no llegaba y la central se lo pasó a otra. */
  | 'REASIGNADA'
  /** La tripulación no respondía y la central cerró la atención desde el panel. */
  | 'CERRADA_POR_CENTRAL'
  | 'OTRO'

/**
 * Los motivos que elige la tripulación al cancelar. Los otros tres no son suyos: quien pidió el traslado lo retira, la
 * central se lo pasa a otra unidad, o la central cierra la atención porque la tripulación no respondía.
 */
export type MotivoCancelacionPropio = Exclude<
  MotivoCancelacion,
  'CANCELADA_POR_SOLICITANTE' | 'REASIGNADA' | 'CERRADA_POR_CENTRAL'
>

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

export type EstadoTraslado =
  | 'PROGRAMADO'
  | 'BUSCANDO_UNIDAD'
  | 'ASIGNADO'
  | 'COMPLETADO'
  | 'NO_REALIZADO'
  | 'NO_CUBIERTO'
  | 'CANCELADO'

/** Para ahora, o para una cita a una hora conocida. */
export type ModoHorario = 'INMEDIATO' | 'PROGRAMADO'

/**
 * `TrasladoResponse` del backend: todo lo que el paramédico necesita saber antes de salir. Viene dentro de la
 * atención cuando el trabajo es un traslado y no una emergencia.
 */
export type TrasladoDeAtencion = {
  id: number
  estado: EstadoTraslado
  /** En qué va la unidad que lo tiene. Dentro de la atención llega siempre nulo: lo dice el estado de la atención. */
  estadoUnidad: EstadoAtencion | null
  modoHorario: ModoHorario
  /** A qué hora tiene que estar en el destino. Nula si es para ahora. */
  horaCita: string | null
  horaSalidaEstimada: string
  /** Última salida posible para llegar a tiempo. */
  horaLimiteSalida: string
  /** La ventana que se le prometió a la familia: cuándo pasa la unidad por el origen. */
  horaRecogidaDesde: string | null
  horaRecogidaHasta: string | null
  pasajero: string
  movilidad: Movilidad
  oxigeno: boolean
  equipo: boolean
  aislamiento: boolean
  pesoAproximado: number | null
  acompanantes: number
  observaciones: string | null
  /** El que hace falta de verdad: mayor que el pedido si una tripulación corrigió la ficha. */
  tipoUnidad: TipoUnidad
  tipoUnidadPedido: TipoUnidad
  origen: Ubicacion
  origenReferencia: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  destino: Ubicacion
  /** El centro del catálogo, si el destino es uno: la entrega lo trae ya elegido. */
  centroSaludDestinoId: number | null
  centroSaludDestino: string | null
  destinoDetalle: string | null
  fechaHoraCreacion: string
}

/** `AtencionResponse` del backend. Cuelga de un incidente o de un traslado, nunca de los dos. */
export type Atencion = {
  id: number
  /** Nulo cuando la atención es un traslado. */
  incidenteId: number | null
  /**
   * Dónde es y qué se sabe del incidente. Llega también cuando el incidente ya se cerró y Firebase lo retiró, que es
   * el rato entre entregar y liberarse. Nulo en traslados.
   */
  incidente: DatosDelIncidente | null
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
  /** Solo en traslados: hasta cuándo espera la tripulación a ese paciente. Antes no se puede retirar por eso. */
  esperaHasta: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSaludId: number | null
  destinoDescripcion: string | null
  /** Todos los que pidieron esta ambulancia retiraron su pedido: hay que decidir si seguir o volverse. */
  emisoresCancelaron: boolean
}

/** `AtencionResponse.DatosDelIncidente` del backend: dónde es y qué se sabe del incidente. */
export type DatosDelIncidente = {
  latitud: number
  longitud: number
  fechaHoraCreacion: string
  cantidadAfectados: number | null
  descripciones: string[]
}

/**
 * El incidente de la atención tal como lo mandó el backend, con la forma que usan el mapa y la dirección. Es el
 * respaldo cuando Firebase no lo tiene: todavía no llegó, o ya lo retiró porque el incidente se cerró.
 */
export function incidenteDeLaAtencion(atencion: Atencion) {
  if (atencion.incidenteId === null || !atencion.incidente) {
    return undefined
  }
  return {
    id: atencion.incidenteId,
    latitud: atencion.incidente.latitud,
    longitud: atencion.incidente.longitud,
    cantidadAfectados: atencion.incidente.cantidadAfectados ?? undefined,
    descripciones: atencion.incidente.descripciones,
  }
}

/** El punto del traslado al que va la unidad. */
export type PuntoDelTraslado = {
  tipo: 'origen' | 'destino'
  ubicacion: Ubicacion
}

/**
 * Hacia dónde va la unidad en un traslado: al origen hasta subir al paciente y al destino desde ahí. Nulo en una
 * emergencia, que tiene su incidente.
 */
export function puntoDelTraslado(atencion: Atencion): PuntoDelTraslado | null {
  const traslado = atencion.traslado
  if (!traslado) {
    return null
  }
  return atencion.horaRecogida === null
    ? { tipo: 'origen', ubicacion: traslado.origen }
    : { tipo: 'destino', ubicacion: traslado.destino }
}

/**
 * El punto del traslado en palabras: cómo se llama y qué más ayuda a encontrarlo. El destino se nombra por su centro
 * de salud, si es uno; el origen, por la dirección que resuelve el teléfono. La referencia que dejó quien lo pidió
 * va aparte, o de nombre si no hay nada mejor.
 */
export function lugarDelTraslado(
  traslado: TrasladoDeAtencion,
  tipo: PuntoDelTraslado['tipo'],
  direccion: string | null | undefined,
): { nombre: string | null; referencia: string | null } {
  if (tipo === 'destino') {
    const nombre = traslado.centroSaludDestino ?? direccion ?? null
    return nombre
      ? { nombre, referencia: traslado.destinoDetalle }
      : { nombre: traslado.destinoDetalle, referencia: null }
  }
  return direccion
    ? { nombre: direccion, referencia: traslado.origenReferencia }
    : { nombre: traslado.origenReferencia, referencia: null }
}

/**
 * Cuándo terminó el trabajo: la entrega, el cierre sin traslado o la cancelación. No la liberación, que es cuándo
 * la unidad volvió a estar disponible y llega más tarde, después del papeleo y la limpieza. `null` si sigue en curso.
 */
export function finDeLaAtencion(atencion: Atencion): string | null {
  return atencion.horaEntrega ?? atencion.horaSinTraslado ?? atencion.horaCancelacion
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
  /** Los traslados que hizo este paramédico, del más reciente al más viejo. */
  misTraslados: (signal?: AbortSignal) => api.get<Atencion[]>('/paramedicos/actual/traslados', { signal }),
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
  cancelar: (atencionId: number, motivo: MotivoCancelacionPropio) =>
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
