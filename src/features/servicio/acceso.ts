import { z } from 'zod'

import { ErrorApi } from '@/shared/api/cliente'

/**
 * Todos los dígitos iguales o seguidos, subiendo o bajando, como 111111, 123456 o 654321: es lo primero que prueba
 * quien agarra un teléfono ajeno. Son las mismas reglas del servidor, para avisarlo antes de enviar.
 */
export function esPinDebil(pin: string) {
  let iguales = true
  let ascendentes = true
  let descendentes = true
  for (let i = 1; i < pin.length; i++) {
    const paso = pin.charCodeAt(i) - pin.charCodeAt(i - 1)
    iguales &&= paso === 0
    ascendentes &&= paso === 1
    descendentes &&= paso === -1
  }
  return iguales || ascendentes || descendentes
}

export const MENSAJE_PIN_DEBIL =
  'Ese PIN es muy fácil de adivinar. No uses todos los números iguales ni seguidos, como 111111 o 123456.'

/** El PIN son 6 dígitos. Si no los tiene, no se revisa nada más: un mensaje por vez. */
export const esquemaPin = z.string().regex(/^\d{6}$/, { error: 'El PIN tiene 6 números.', abort: true })

/** El PIN que se crea al activar el teléfono: además, que no sea fácil de adivinar. */
export const esquemaPinNuevo = esquemaPin.refine((pin) => !esPinDebil(pin), MENSAJE_PIN_DEBIL)

/**
 * Cómo se escribe un PIN: teclado numérico, oculto y sin que el teléfono lo guarde ni lo sugiera. Si el
 * autocompletado lo recordara, pedirlo no probaría quién tiene el teléfono en la mano.
 */
export const propsCampoPin = {
  keyboardType: 'number-pad',
  secureTextEntry: true,
  maxLength: 6,
  autoComplete: 'off',
  importantForAutofill: 'no',
  textContentType: 'none',
} as const

export const MENSAJE_TELEFONO_NO_ENCONTRADO =
  'No encontramos ese teléfono. Pídele al administrador que verifique con qué número te registró.'

/** El código de error del servidor, si lo trae. */
export function codigoDeError(error: unknown) {
  return error instanceof ErrorApi ? error.codigo : undefined
}

/** Cuántos intentos quedan, en los rechazos de un PIN o de un código de activación. */
export function intentosRestantes(error: unknown): number | null {
  if (!(error instanceof ErrorApi)) {
    return null
  }
  const restantes = error.cuerpo.intentosRestantes
  return typeof restantes === 'number' ? restantes : null
}

export function textoIntentos(restantes: number) {
  return restantes === 1 ? 'Te queda 1 intento.' : `Te quedan ${restantes} intentos.`
}

/** Un PIN equivocado, con los intentos que quedan antes de que se bloquee. */
export function mensajePinIncorrecto(error: unknown) {
  const restantes = intentosRestantes(error)
  return restantes === null ? 'El PIN no es correcto.' : `El PIN no es correcto. ${textoIntentos(restantes)}`
}
