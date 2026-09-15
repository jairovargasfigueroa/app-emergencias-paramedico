import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { Platform } from 'react-native'

import { servicioApi } from '@/features/servicio/api'

/** Canal de Android para los incidentes nuevos. app.json lo declara como canal por defecto de FCM. */
export const CANAL_INCIDENTES = 'incidentes'

// Con la app abierta, el push de un incidente nuevo también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * PB-03 R3: registra el token de FCM del teléfono para recibir los incidentes nuevos con la app cerrada. Un
 * dispositivo nuevo reemplaza al anterior. En Expo Go para Android no hay push: falla en silencio.
 */
export async function registrarDispositivo(paramedicoId: number) {
  try {
    if (Platform.OS === 'android') {
      // El canal debe existir antes de pedir el permiso y el token.
      await Notifications.setNotificationChannelAsync(CANAL_INCIDENTES, {
        name: 'Incidentes nuevos',
        importance: Notifications.AndroidImportance.MAX,
      })
    }
    let permiso = await Notifications.getPermissionsAsync()
    if (!permiso.granted && permiso.canAskAgain) {
      permiso = await Notifications.requestPermissionsAsync()
    }
    if (!permiso.granted) {
      return
    }
    const token = await Notifications.getDevicePushTokenAsync()
    await servicioApi.registrarDispositivo(paramedicoId, String(token.data))
  } catch {
    // Sin push disponible: los incidentes igual llegan en tiempo real con la app abierta.
  }
}

export async function actualizarTokenDelDispositivo(paramedicoId: number, token: Notifications.DevicePushToken) {
  try {
    await servicioApi.registrarDispositivo(paramedicoId, String(token.data))
  } catch {
    // Se vuelve a registrar la próxima vez que se abra la app.
  }
}

const respuestasAtendidas = new Set<string>()

/** Al tocar el push, abre el incidente. El backend manda su id en el campo `incidenteId` del mensaje. */
export function abrirIncidenteDeNotificacion(respuesta: Notifications.NotificationResponse) {
  const identificador = respuesta.notification.request.identifier
  if (respuestasAtendidas.has(identificador)) {
    return
  }
  respuestasAtendidas.add(identificador)
  const incidenteId = respuesta.notification.request.content.data?.incidenteId
  if (typeof incidenteId === 'string' || typeof incidenteId === 'number') {
    router.push({ pathname: '/incidente/[id]', params: { id: String(incidenteId) } })
  }
}
