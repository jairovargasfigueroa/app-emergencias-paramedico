import * as Location from 'expo-location'

import type { Distancia } from '@/shared/formato/distancia'

/** Arma una dirección legible con lo que devuelve el geocodificador del teléfono, p. ej. "Av. Santos Dumont, Equipetrol". */
export function formatearDireccion(direccion: Location.LocationGeocodedAddress): string | null {
  const calle = [direccion.street, direccion.streetNumber].filter(Boolean).join(' ').trim()
  const principal = calle || direccion.name?.trim() || ''
  const zona = [direccion.district, direccion.city]
    .map((parte) => parte?.trim() ?? '')
    .find((parte) => parte.length > 0 && parte !== principal)
  const partes = [principal, zona].filter((parte): parte is string => Boolean(parte))
  return partes.length > 0 ? partes.join(', ') : null
}

/**
 * Dirección aproximada del incidente. La resuelve el teléfono con expo-location: no hay endpoint para esto y el
 * servidor solo publica coordenadas.
 */
export async function direccionAproximada(latitud: number, longitud: number): Promise<string | null> {
  const direcciones = await Location.reverseGeocodeAsync({ latitude: latitud, longitude: longitud })
  const primera = direcciones[0]
  return primera ? formatearDireccion(primera) : null
}

/** El título de una emergencia es el lugar. Sin dirección, a qué distancia queda; nunca los afectados. */
export function tituloDelLugar(direccion: string | null | undefined, distancia: Distancia | null): string {
  if (direccion) {
    return direccion
  }
  if (distancia) {
    return `A ${distancia.valor} ${distancia.unidad} de ti`
  }
  return 'Emergencia abierta'
}
