import { useEffect } from 'react'

import {
  abrirIncidenteDeNotificacion,
  actualizarTokenDelDispositivo,
  cargarNotificaciones,
  registrarDispositivo,
} from './notificaciones'

/**
 * Registra el dispositivo, sigue los cambios de token y abre el incidente cuando se toca un push. Donde no hay push
 * (Expo Go para Android) no hace nada.
 */
export function useNotificaciones(paramedicoId: number) {
  useEffect(() => {
    let activo = true
    const suscripciones: { remove: () => void }[] = []

    void cargarNotificaciones().then((Notifications) => {
      if (!Notifications || !activo) {
        return
      }
      void registrarDispositivo(paramedicoId)

      const ultimaRespuesta = Notifications.getLastNotificationResponse()
      if (ultimaRespuesta && ultimaRespuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        abrirIncidenteDeNotificacion(ultimaRespuesta)
      }

      suscripciones.push(
        Notifications.addNotificationResponseReceivedListener((respuesta) => {
          if (respuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            abrirIncidenteDeNotificacion(respuesta)
          }
        }),
        Notifications.addPushTokenListener((token) => {
          void actualizarTokenDelDispositivo(paramedicoId, token)
        }),
      )
    })

    return () => {
      activo = false
      suscripciones.forEach((suscripcion) => suscripcion.remove())
    }
  }, [paramedicoId])
}
