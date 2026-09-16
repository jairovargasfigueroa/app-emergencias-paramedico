const RADIO_TIERRA_M = 6_371_000

export type Coordenadas = {
  latitud: number
  longitud: number
}

/** Distancia en metros entre dos puntos (fórmula del haversine). Basta para ordenar por cercanía. */
export function distanciaEnMetros(desde: Coordenadas, hasta: Coordenadas): number {
  const aRadianes = (grados: number) => (grados * Math.PI) / 180
  const dLat = aRadianes(hasta.latitud - desde.latitud)
  const dLon = aRadianes(hasta.longitud - desde.longitud)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(desde.latitud)) * Math.cos(aRadianes(hasta.latitud)) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a))
}

export type Distancia = {
  valor: string
  unidad: 'm' | 'km'
}

/** "500 m" por debajo de un kilómetro; "2,1 km" o "10 km" por encima. */
export function formatearDistancia(metros: number): Distancia {
  if (metros < 1000) {
    return { valor: String(Math.round(metros / 10) * 10), unidad: 'm' }
  }
  const km = metros / 1000
  return { valor: km < 10 ? km.toFixed(1).replace('.', ',') : String(Math.round(km)), unidad: 'km' }
}
