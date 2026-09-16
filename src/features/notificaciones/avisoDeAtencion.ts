import { Platform } from 'react-native'

import { cargarNotificaciones, TIPO_ATENCION_EN_CURSO } from './notificaciones'

/** Canal de Android del aviso fijo: importancia baja, porque no interrumpe, solo acompaña. */
const CANAL_ATENCION = 'atencion-en-curso'
/** Un único aviso a la vez: al volver a programarlo con el mismo id, reemplaza al anterior. */
const ID_AVISO = 'sga-atencion-en-curso'

let canalCreado = false

/**
 * Aviso fijo mientras hay una atención activa: el paramédico guarda el teléfono en el bolsillo mientras el conductor
 * maneja, así el caso sigue a la vista y un toque lo devuelve a la app. Donde no hay notificaciones (Expo Go en
 * Android) no hace nada, igual que el push de incidentes.
 */
export async function mostrarAvisoDeAtencion(titulo: string, cuerpo: string) {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return
  }
  try {
    if (Platform.OS === 'android' && !canalCreado) {
      await Notifications.setNotificationChannelAsync(CANAL_ATENCION, {
        name: 'Atención en curso',
        importance: Notifications.AndroidImportance.LOW,
      })
      canalCreado = true
    }
    await Notifications.scheduleNotificationAsync({
      identifier: ID_AVISO,
      content: {
        title: titulo,
        body: cuerpo,
        // Sin `incidenteId`: al tocarlo solo abre la app, no navega a ningún incidente.
        data: { tipo: TIPO_ATENCION_EN_CURSO },
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: { channelId: CANAL_ATENCION },
    })
  } catch {
    // Sin permiso o sin soporte: la atención se sigue viendo al abrir la app.
  }
}

export async function quitarAvisoDeAtencion() {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_AVISO)
    await Notifications.dismissNotificationAsync(ID_AVISO)
  } catch {
    // No había nada que quitar.
  }
}
