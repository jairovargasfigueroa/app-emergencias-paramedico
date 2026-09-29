import { useEffect } from 'react'

import {
  abrirIncidenteDeNotificacion,
  actualizarTokenDelDispositivo,
  cargarNotificaciones,
  recibirNotificacion,
  registrarDispositivo,
} from './notificaciones'

/**
 * Registra el dispositivo, sigue los cambios de token y abre lo que trae un push cuando se lo toca. Con la app abierta,
 * un push de traslado, de despacho o un aviso de la central además refresca la unidad: el cambio aparece sin tener que
 * tocarlo. Donde no hay push (Expo Go para Android) no hace nada.
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
        abrirIncidenteDeNotificacion(ultimaRespuesta, paramedicoId)
      }

      suscripciones.push(
        Notifications.addNotificationReceivedListener((notificacion) => {
          recibirNotificacion(notificacion, paramedicoId)
        }),
        Notifications.addNotificationResponseReceivedListener((respuesta) => {
          if (respuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            abrirIncidenteDeNotificacion(respuesta, paramedicoId)
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
