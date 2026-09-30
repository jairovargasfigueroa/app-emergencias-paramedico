import * as SecureStore from 'expo-secure-store'

/**
 * Lo que queda guardado en el teléfono al entrar: el token con el que se llama a la API, hasta cuándo vale y quién es.
 * `venceEn` es un instante ISO-8601 en UTC, el mismo del `exp` del token. Es `null` solo si una sesión guardada antes
 * de que el servidor lo informara trae un token que no se puede leer.
 */
export type Sesion<T> = {
  token: string
  venceEn: string | null
  usuario: T
}

const CLAVE_SESION = 'sga.sesion'

/** Copia en memoria del token, para no leer el almacén seguro en cada petición. */
let tokenEnMemoria: string | null | undefined
let lectura: Promise<string | null> | null = null

export async function leerSesion<T>(): Promise<Sesion<T> | null> {
  const guardada = await SecureStore.getItemAsync(CLAVE_SESION)
  if (!guardada) {
    tokenEnMemoria = null
    return null
  }
  try {
    const sesion = JSON.parse(guardada) as Omit<Sesion<T>, 'venceEn'> & { venceEn?: string | null }
    tokenEnMemoria = sesion.token
    // Las sesiones abiertas antes de que el servidor informara el vencimiento no lo traen: se lee del propio token.
    return { ...sesion, venceEn: sesion.venceEn ?? venceEnDelToken(sesion.token) }
  } catch {
    tokenEnMemoria = null
    return null
  }
}

export async function guardarSesion<T>(sesion: Sesion<T>) {
  tokenEnMemoria = sesion.token
  await SecureStore.setItemAsync(CLAVE_SESION, JSON.stringify(sesion))
}

export async function borrarSesion() {
  tokenEnMemoria = null
  await SecureStore.deleteItemAsync(CLAVE_SESION)
}

/** Token de la sesión abierta, o `null`. Lo lee el cliente HTTP en cada petición. */
export async function tokenActual(): Promise<string | null> {
  if (tokenEnMemoria !== undefined) {
    return tokenEnMemoria
  }
  // Varias peticiones al abrir la app comparten la misma lectura del almacén.
  lectura ??= leerSesion().then((sesion) => {
    lectura = null
    return sesion?.token ?? null
  })
  return lectura
}

/** Vencimiento de un JWT: su parte central es JSON en base64url y `exp` va en segundos. `null` si no se puede leer. */
function venceEnDelToken(token: string): string | null {
  try {
    const partes = token.split('.')
    if (partes.length !== 3) {
      return null
    }
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const datos = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { exp?: unknown }
    return typeof datos.exp === 'number' ? new Date(datos.exp * 1000).toISOString() : null
  } catch {
    return null
  }
}
