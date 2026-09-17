import * as SecureStore from 'expo-secure-store'

/** Lo mínimo para identificar al paramédico en cada petición. El resto se consulta al backend. */
export type ParamedicoGuardado = {
  id: number
  nombreCompleto: string
}

const CLAVE_PARAMEDICO = 'sga.paramedico'

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
