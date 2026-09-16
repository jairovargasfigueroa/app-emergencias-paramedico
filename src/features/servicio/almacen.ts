import * as SecureStore from 'expo-secure-store'

/** Lo mínimo para identificar al paramédico en cada petición. El resto se consulta al backend. */
export type ParamedicoGuardado = {
  id: number
  nombreCompleto: string
}

const CLAVE_PARAMEDICO = 'sga.paramedico'
const CLAVE_AVISO_SERVICIO = 'sga.aviso-servicio'

export async function leerParamedicoGuardado(): Promise<ParamedicoGuardado | null> {
  const guardado = await SecureStore.getItemAsync(CLAVE_PARAMEDICO)
  if (!guardado) {
    return null
  }
  try {
    return JSON.parse(guardado) as ParamedicoGuardado
  } catch {
    return null
  }
}

export function guardarParamedico(paramedico: ParamedicoGuardado) {
  return SecureStore.setItemAsync(CLAVE_PARAMEDICO, JSON.stringify(paramedico))
}

export function borrarParamedicoGuardado() {
  return SecureStore.deleteItemAsync(CLAVE_PARAMEDICO)
}

/**
 * Si este paramédico ya vio el aviso de que se comparte la ubicación de su unidad durante el turno. Se guarda su id:
 * otro paramédico en el mismo teléfono también tiene que verlo, es su ubicación.
 */
export async function leerAvisoDeServicioVisto(paramedicoId: number): Promise<boolean> {
  return (await SecureStore.getItemAsync(CLAVE_AVISO_SERVICIO)) === String(paramedicoId)
}

export function guardarAvisoDeServicioVisto(paramedicoId: number) {
  return SecureStore.setItemAsync(CLAVE_AVISO_SERVICIO, String(paramedicoId))
}
