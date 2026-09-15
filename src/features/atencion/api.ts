import { api } from '@/shared/api/cliente'

export type EstadoAtencion = 'EN_CAMINO' | 'EN_EL_LUGAR' | 'PACIENTE_RECOGIDO' | 'PACIENTE_ENTREGADO' | 'CANCELADA'

export type MotivoCancelacion = 'AVERIA' | 'NO_SE_ENCONTRO_PACIENTE' | 'DESVIADA' | 'OTRO'

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
  horaEntrega: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSaludId: number | null
  destinoDescripcion: string | null
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
  activa: (paramedicoId: number, signal?: AbortSignal) =>
    api.get<Atencion | undefined>('/paramedicos/actual/atencion', { usuarioId: paramedicoId, signal }),
  marcarLlegada: (paramedicoId: number, atencionId: number, ubicacion: Ubicacion) =>
    api.post<Atencion>(`/atenciones/${atencionId}/llegada`, ubicacion, { usuarioId: paramedicoId }),
  marcarRecogida: (paramedicoId: number, atencionId: number, datos: Ubicacion & DatosPaciente) =>
    api.post<Atencion>(`/atenciones/${atencionId}/recogida`, datos, { usuarioId: paramedicoId }),
  entregar: (paramedicoId: number, atencionId: number, datos: Entrega) =>
    api.post<Atencion>(`/atenciones/${atencionId}/entrega`, datos, { usuarioId: paramedicoId }),
  cancelar: (paramedicoId: number, atencionId: number, motivo: MotivoCancelacion) =>
    api.post<Atencion>(`/atenciones/${atencionId}/cancelar`, { motivo }, { usuarioId: paramedicoId }),
  actualizarPaciente: (paramedicoId: number, atencionId: number, datos: DatosPaciente) =>
    api.post<Atencion>(`/atenciones/${atencionId}/paciente`, datos, { usuarioId: paramedicoId }),
  centrosSalud: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', { signal }),
}
