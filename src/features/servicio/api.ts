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

/** `SesionResponse.Paramedico` del backend: el token y el paramédico al que pertenece. */
export type SesionParamedico = {
  token: string
  paramedico: Paramedico
}

export const servicioApi = {
  /** Entrada a la app: el teléfono identifica al paramédico y el servidor devuelve el token de la sesión. */
  identificar: (telefono: string) =>
    api.post<SesionParamedico>('/auth/paramedico', { telefono }, { sinToken: true }),
  actual: (signal?: AbortSignal) => api.get<ServicioActual>('/paramedicos/actual', { signal }),
  registrarDispositivo: (tokenPush: string) => api.post<void>('/paramedicos/actual/dispositivo', { tokenPush }),
  /** ME-1 M5: tras una avería, el paramédico vuelve a poner la ambulancia DISPONIBLE (PB-05 R11). */
  reactivarAmbulancia: (ambulanciaId: number) => api.post<Ambulancia>(`/ambulancias/${ambulanciaId}/reactivar`),
}
