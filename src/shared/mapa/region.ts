import type { Region } from 'react-native-maps'

import type { Coordenadas } from '@/shared/formato/distancia'

/** Acercamiento del mapa en grados: a nivel de calle, de barrio o de ciudad. */
export const DELTA_CALLE = 0.006
export const DELTA_BARRIO = 0.03
export const DELTA_CIUDAD = 0.12

/** Centro del mapa mientras no se conoce ninguna posición. Se configura en .env.local. */
export const CENTRO_POR_DEFECTO: Coordenadas = {
  latitud: numeroDeEntorno(process.env.EXPO_PUBLIC_MAPA_LATITUD),
  longitud: numeroDeEntorno(process.env.EXPO_PUBLIC_MAPA_LONGITUD),
}

export function regionAlrededorDe({ latitud, longitud }: Coordenadas, delta: number): Region {
  return { latitude: latitud, longitude: longitud, latitudeDelta: delta, longitudeDelta: delta }
}

function numeroDeEntorno(valor: string | undefined) {
  const numero = Number(valor)
  return valor && Number.isFinite(numero) ? numero : 0
}
