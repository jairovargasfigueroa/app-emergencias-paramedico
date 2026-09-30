import { api } from '@/shared/api/cliente'

export type EstadoAmbulancia = 'SIN_TURNO' | 'DISPONIBLE' | 'EN_ATENCION' | 'FUERA_DE_SERVICIO'

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
  /** Tiene PIN y un teléfono vinculado. Si no, necesita un código de activación de la central. */
  activado: boolean
  /** Su PIN se bloqueó por intentos fallidos: no entra hasta activar el teléfono con un código nuevo. */
  bloqueado: boolean
}

/** `TurnoResponse` del backend: el turno abierto del paramédico. */
export type Turno = {
  id: number
  inicio: string
  ambulanciaId: number
  placa: string
}

/**
 * `ServicioActualResponse` del backend. `enServicio` dice que *puede* trabajar: tiene asignación vigente a una
 * ambulancia activa. `turno` dice si está trabajando *ahora*, que es otra cosa: `null` es que todavía no entró.
 */
export type ServicioActual = {
  paramedico: Paramedico
  ambulancia: Ambulancia | null
  enServicio: boolean
  turno: Turno | null
}

/**
 * `SesionResponse.Paramedico` del backend: el token, cuándo vence y el paramédico al que pertenece. `venceEn` es un
 * instante ISO-8601 en UTC y coincide con el `exp` del token.
 */
export type SesionParamedico = {
  token: string
  venceEn: string
  paramedico: Paramedico
}

/**
 * `SesionResponse.ParamedicoActivado` del backend: la sesión, más la clave que vincula la cuenta a este teléfono. Es
 * la única vez que viaja: 43 caracteres base64url que se guardan en el almacén seguro.
 */
export type SesionParamedicoActivado = SesionParamedico & {
  claveDispositivo: string
}

/** `ActivacionParamedicoRequest` del backend. El código vale con o sin guion; el PIN son 6 dígitos. */
export type DatosActivacion = {
  telefono: string
  codigo: string
  pin: string
}

/** `IngresoParamedicoRequest` del backend: quién es, su PIN y la clave del teléfono vinculado. */
export type DatosIngreso = {
  telefono: string
  pin: string
  claveDispositivo: string
}

/** `IniciarTurnoRequest` del backend: el PIN otra vez, desde el teléfono vinculado. */
export type DatosInicioTurno = {
  pin: string
  claveDispositivo: string
}

export const servicioApi = {
  /** Primera vez en este teléfono: el código que dio la central prueba quién es, y ahí crea su PIN. */
  activar: (datos: DatosActivacion) =>
    api.post<SesionParamedicoActivado>('/auth/paramedico/activacion', datos, { sinToken: true }),
  /** Entrada de todos los días, con su PIN y desde el teléfono vinculado. */
  ingresar: (datos: DatosIngreso) => api.post<SesionParamedico>('/auth/paramedico', datos, { sinToken: true }),
  actual: (signal?: AbortSignal) => api.get<ServicioActual>('/paramedicos/actual', { signal }),
  registrarDispositivo: (tokenPush: string) => api.post<void>('/paramedicos/actual/dispositivo', { tokenPush }),
  /** Entra a trabajar: su unidad pasa a contar como disponible y empieza a compartir la posición. */
  iniciarTurno: (datos: DatosInicioTurno) => api.post<Turno>('/paramedicos/actual/turno/inicio', datos),
  /** Sale de trabajar. El backend lo rechaza con una atención en curso. */
  terminarTurno: () => api.post<Turno>('/paramedicos/actual/turno/cierre'),
  /** ME-1 M5: tras una avería, el paramédico vuelve a poner la ambulancia DISPONIBLE (PB-05 R11). */
  reactivarAmbulancia: (ambulanciaId: number) => api.post<Ambulancia>(`/ambulancias/${ambulanciaId}/reactivar`),
}
