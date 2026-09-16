import * as Location from 'expo-location'

import { servicioKeys } from '@/features/servicio/queries'
import { ErrorApi } from '@/shared/api/cliente'
import type { Coordenadas } from '@/shared/formato/distancia'
import { queryClient } from '@/shared/query/queryClient'

import { posicionApi } from './api'
import { cambiarEstadoUbicacion } from './estadoUbicacion'
import { actualizarPosicionActual } from './posicionActual'

/** Cada cuántos milisegundos se envía la posición mientras el paramédico está en servicio (PB-03 R4). */
export const INTERVALO_ENVIO_MS = segundosDeEntorno(process.env.EXPO_PUBLIC_ENVIO_POSICION_SEG) * 1000

let ultimoEnvio = 0

export function coordenadasDe(posicion: Location.LocationObject): Coordenadas {
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }
}

/**
 * Guarda la posición para el mapa y la envía al servidor si pasó el intervalo desde el último envío. El servidor la
 * publica en tiempo real y persiste la última posición cada cierto tiempo (R5). Un envío fallido no se reintenta: el
 * siguiente lo reemplaza.
 */
export async function registrarPosicion(paramedicoId: number, coordenadas: Coordenadas) {
  actualizarPosicionActual(coordenadas)
  // Único punto por donde entran las posiciones, con la app abierta y en segundo plano.
  cambiarEstadoUbicacion('activa')
  const ahora = Date.now()
  if (ahora - ultimoEnvio < INTERVALO_ENVIO_MS) {
    return
  }
  ultimoEnvio = ahora
  try {
    await posicionApi.enviar(paramedicoId, coordenadas.latitud, coordenadas.longitud)
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === 'SIN_SERVICIO') {
      // El paramédico dejó de estar en servicio: se refresca para que la app deje de transmitir.
      void queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
    }
  }
}

function segundosDeEntorno(valor: string | undefined) {
  const segundos = Number(valor)
  return valor && Number.isFinite(segundos) && segundos > 0 ? segundos : 5
}
