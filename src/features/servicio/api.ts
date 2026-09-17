import { api } from '@/shared/api/cliente'

export type EstadoAmbulancia = 'DISPONIBLE' | 'EN_ATENCION' | 'FUERA_DE_SERVICIO'

/** `AmbulanciaResponse` del backend. */
export type Ambulancia = {
  id: number
  placa: string
  tipoUnidad: string
  estado: EstadoAmbulancia
  activa: boolean
}

/** `AsignacionVigenteResponse` del backend. */
export type AsignacionVigente = {
  asignacionId: number
  ambulanciaId: number
  placa: string
  fechaInicio: string
}

/** `ParamedicoResponse` del backend. */
export type Paramedico = {
  id: number
  nombreCompleto: string
  telefono: string
  activo: boolean
  asignacionVigente: AsignacionVigente | null
}

/** `ServicioActualResponse` del backend. En servicio: asignación vigente a una ambulancia activa. */
export type ServicioActual = {
  paramedico: Paramedico
  ambulancia: Ambulancia | null
  enServicio: boolean
}

export const servicioApi = {
  /** Identificación provisional por teléfono, mientras no exista autenticación. */
  identificar: (telefono: string) => api.post<Paramedico>('/paramedicos/identificacion', { telefono }),
  actual: (paramedicoId: number, signal?: AbortSignal) =>
    api.get<ServicioActual>('/paramedicos/actual', { usuarioId: paramedicoId, signal }),
  registrarDispositivo: (paramedicoId: number, tokenPush: string) =>
    api.post<void>('/paramedicos/actual/dispositivo', { tokenPush }, { usuarioId: paramedicoId }),
}
