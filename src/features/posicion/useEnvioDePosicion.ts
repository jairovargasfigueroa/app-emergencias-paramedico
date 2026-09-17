import * as Location from 'expo-location'
import { useEffect } from 'react'

import { coordenadasDe, INTERVALO_ENVIO_MS, registrarPosicion } from './envioDePosicion'
import { detenerEnvioEnSegundoPlano, iniciarEnvioEnSegundoPlano } from './tareaEnSegundoPlano'

/**
 * PB-03 R4: mientras el paramédico está en servicio, la posición se transmite siempre, no solo durante una atención.
 * Con la app abierta se sigue con `watchPositionAsync`; si hay permiso, una tarea la sigue enviando en segundo plano.
 */
export function useEnvioDePosicion(paramedicoId: number, enServicio: boolean) {
  useEffect(() => {
    if (!enServicio) {
      void detenerEnvioEnSegundoPlano()
      return
    }

    let cancelado = false
    let suscripcion: Location.LocationSubscription | null = null

    async function empezar() {
      const permiso = await Location.requestForegroundPermissionsAsync()
      if (!permiso.granted || cancelado) {
        return
      }
      const nueva = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: INTERVALO_ENVIO_MS, distanceInterval: 0 },
        (posicion) => void registrarPosicion(paramedicoId, coordenadasDe(posicion)),
      )
      if (cancelado) {
        nueva.remove()
        return
      }
      suscripcion = nueva
      await iniciarEnvioEnSegundoPlano()
    }

    empezar().catch(() => {})

    return () => {
      cancelado = true
      suscripcion?.remove()
      void detenerEnvioEnSegundoPlano()
    }
  }, [paramedicoId, enServicio])
}
