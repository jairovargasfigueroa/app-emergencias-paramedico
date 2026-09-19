import * as Location from 'expo-location'
import { useEffect } from 'react'

import { DEMO } from '@/features/demo/bandera'
import { useSimulador } from '@/features/demo/simulador'

import { coordenadasDe, INTERVALO_ENVIO_MS, registrarPosicion } from './envioDePosicion'
import { cambiarEstadoUbicacion, useIntentosDeUbicacion } from './estadoUbicacion'
import { detenerEnvioEnSegundoPlano, iniciarEnvioEnSegundoPlano } from './tareaEnSegundoPlano'

/**
 * PB-03 R4: mientras el paramédico está en servicio, la posición se transmite siempre, no solo durante una atención.
 * Con la app abierta se sigue con `watchPositionAsync`; si hay permiso, una tarea la sigue enviando en segundo plano.
 * El resultado del permiso queda publicado para que la pantalla pueda decirlo en vez de fallar en silencio.
 */
export function useEnvioDePosicion(paramedicoId: number, enTurno: boolean) {
  const intento = useIntentosDeUbicacion()
  const simulador = useSimulador()
  const enDemostracion = DEMO && simulador.recorrido !== null

  // Demostración: la posición sale del recorrido inventado y entra por el mismo camino que la real, así que el
  // mapa, los hitos y el envío al servidor no se enteran. Mientras tanto no se toca el GPS del teléfono.
  useEffect(() => {
    if (!enDemostracion || !enTurno || !simulador.posicion) {
      return
    }
    void registrarPosicion(paramedicoId, simulador.posicion)
  }, [enDemostracion, enTurno, paramedicoId, simulador.posicion])

  useEffect(() => {
    if (!enTurno || enDemostracion) {
      void detenerEnvioEnSegundoPlano()
      return
    }

    let cancelado = false
    let suscripcion: Location.LocationSubscription | null = null

    async function empezar() {
      cambiarEstadoUbicacion('pidiendo')
      const permiso = await Location.requestForegroundPermissionsAsync()
      if (!permiso.granted) {
        // Negado para siempre: solo se arregla en los ajustes del sistema.
        cambiarEstadoUbicacion(permiso.canAskAgain ? 'sin-permiso' : 'permiso-bloqueado')
        return
      }
      if (cancelado) {
        return
      }
      cambiarEstadoUbicacion('esperando')
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

    empezar().catch(() => cambiarEstadoUbicacion('sin-permiso'))

    return () => {
      cancelado = true
      suscripcion?.remove()
      void detenerEnvioEnSegundoPlano()
    }
  }, [paramedicoId, enTurno, intento, enDemostracion])
}
