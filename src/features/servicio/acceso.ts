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

/**
 * Los PIN más usados que no caen en otra regla: dibujos sobre el teclado, pares y números conocidos. Es la misma lista
 * del servidor; los bloques repetidos, como 121212 o 123123, se revisan aparte.
 */
const PINES_MAS_USADOS = new Set([
  '112233', '123321', '112211', '159753', '147258', '789456', '123654', '147852', '159357',
  '258456', '741852', '963852', '102030', '112358', '314159', '246810', '135790',
])

/** 121212 es el bloque "12" tres veces; 123123, el bloque "123" dos veces. */
function esBloqueRepetido(pin: string, largoDelBloque: number) {
  return pin.slice(0, largoDelBloque).repeat(Math.floor(pin.length / largoDelBloque)) === pin
}

/** Lo que se prueba después de los iguales y los seguidos: los bloques repetidos y los PIN más usados. */
export function esDeLosMasUsados(pin: string) {
  return esBloqueRepetido(pin, 2) || esBloqueRepetido(pin, 3) || PINES_MAS_USADOS.has(pin)
}

const MENSAJE_PIN_MAS_USADO = 'Ese PIN es de los más usados. Elige otro.'

/**
 * Si los 6 números del PIN aparecen seguidos en el teléfono, como 123456 en el 71234567: sus compañeros conocen el
 * número, así que es de lo primero que probarían.
 */
export function saleDelTelefono(pin: string, telefono: string) {
  return telefono.replace(/\D/g, '').includes(pin)
}

export const MENSAJE_PIN_DEL_TELEFONO = 'No uses números de tu teléfono en el PIN: tus compañeros lo conocen.'

/** Si el PIN ya tiene sus 6 números. */
export function pinCompleto(pin: string) {
  return /^\d{6}$/.test(pin)
}

/** El PIN son 6 dígitos. Si no los tiene, no se revisa nada más: un mensaje por vez. */
export const esquemaPin = z
  .string()
  .min(1, { error: 'Escribe tu PIN.', abort: true })
  .regex(/^\d{6}$/, { error: 'El PIN tiene que tener 6 números.', abort: true })

/**
 * El PIN que se crea al activar el teléfono: además, que no sea fácil de adivinar. Las reglas van en el orden en que
 * las revisa el servidor y la primera que falla corta las demás: un mensaje por vez. La del teléfono la revisa el
 * formulario, que es el que tiene el número.
 */
export const esquemaPinNuevo = esquemaPin
  .refine((pin) => !esPinDebil(pin), { error: MENSAJE_PIN_DEBIL, abort: true })
  .refine((pin) => !esDeLosMasUsados(pin), { error: MENSAJE_PIN_MAS_USADO, abort: true })

/** Cómo va una regla del PIN nuevo mientras se escribe: todavía sin revisar, cumplida o no. */
export type EstadoRegla = 'pendiente' | 'cumple' | 'no-cumple'

export type ReglaRevisada = { texto: string; estado: EstadoRegla }

/**
 * Las reglas del PIN nuevo, en el orden del servidor, para tenerlas a la vista mientras se crea: así se sabe qué falta
 * antes de enviarlo. "6 números" se marca desde el primer dígito; las demás, recién con los 6, porque antes no hay
 * PIN que revisar. Recibe el teléfono para recalcular la última también cuando cambia el número.
 */
export function revisarPinNuevo(pin: string, telefono: string): ReglaRevisada[] {
  const completo = pinCompleto(pin)
  const segun = (cumple: boolean): EstadoRegla => (cumple ? 'cumple' : 'no-cumple')
  const conLosSeis = (cumple: () => boolean): EstadoRegla => (completo ? segun(cumple()) : 'pendiente')
  return [
    { texto: '6 números', estado: pin === '' ? 'pendiente' : segun(completo) },
    { texto: 'Ni todos iguales ni seguidos', estado: conLosSeis(() => !esPinDebil(pin)) },
    { texto: 'Que no sea de los más usados', estado: conLosSeis(() => !esDeLosMasUsados(pin)) },
    { texto: 'Que no sean los números de tu teléfono', estado: conLosSeis(() => !saleDelTelefono(pin, telefono)) },
  ]
}

/** Las letras y números del código de activación, sin contar el guion. */
const LARGO_CODIGO_ACTIVACION = 8

/**
 * El código de activación tal como lo entrega la central, `XXXX-XXXX`, mientras se escribe: en mayúsculas, sin lo que
 * no sea letra o número y con el guion después del cuarto carácter. El guion aparece recién con el quinto: si
 * apareciera con el cuarto, borrar hacia atrás lo volvería a poner y no se podría pasar de ahí. El servidor acepta el
 * código con guion o sin él.
 */
export function formatearCodigoActivacion(texto: string) {
  const caracteres = texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LARGO_CODIGO_ACTIVACION)
  return caracteres.length > 4 ? `${caracteres.slice(0, 4)}-${caracteres.slice(4)}` : caracteres
}

/** Si el código tiene sus 8 letras y números: recién ahí vale la pena mandarlo, que cada código equivocado cuenta. */
export function codigoActivacionCompleto(codigo: string) {
  return codigo.replace(/[^A-Za-z0-9]/g, '').length === LARGO_CODIGO_ACTIVACION
}

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
