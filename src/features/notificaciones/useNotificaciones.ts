import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'

import { abrirIncidenteDeNotificacion, actualizarTokenDelDispositivo, registrarDispositivo } from './notificaciones'

/** Registra el dispositivo, sigue los cambios de token y abre el incidente cuando se toca un push. */
export function useNotificaciones(paramedicoId: number) {
  useEffect(() => {
    void registrarDispositivo(paramedicoId)

    const ultimaRespuesta = Notifications.getLastNotificationResponse()
    if (ultimaRespuesta && ultimaRespuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      abrirIncidenteDeNotificacion(ultimaRespuesta)
    }

    const alTocar = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      if (respuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        abrirIncidenteDeNotificacion(respuesta)
      }
    })
    const alCambiarToken = Notifications.addPushTokenListener((token) => {
      void actualizarTokenDelDispositivo(paramedicoId, token)
    })

    return () => {
      alTocar.remove()
      alCambiarToken.remove()
    }
  }, [paramedicoId])
}
