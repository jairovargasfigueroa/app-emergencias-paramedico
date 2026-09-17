import { isRunningInExpoGo } from 'expo'
import { router } from 'expo-router'
import type { DevicePushToken, NotificationResponse } from 'expo-notifications'
import { Platform } from 'react-native'

import { servicioApi } from '@/features/servicio/api'

/** Canal de Android para los incidentes nuevos. app.json lo declara como canal por defecto de FCM. */
export const CANAL_INCIDENTES = 'incidentes'

/** Marca del aviso fijo de la atención en curso, para distinguirlo de un incidente nuevo. */
export const TIPO_ATENCION_EN_CURSO = 'atencion-en-curso'

type ModuloNotificaciones = typeof import('expo-notifications')

/**
 * Expo Go para Android no trae push desde el SDK 53 y expo-notifications lanza un error apenas se importa. Por eso
 * se carga solo donde hay push (development build, o iOS); en Expo Go para Android la app sigue sin push.
 */
const pushDisponible = !(Platform.OS === 'android' && isRunningInExpoGo())

let moduloNotificaciones: Promise<ModuloNotificaciones | null> | null = null

export function cargarNotificaciones(): Promise<ModuloNotificaciones | null> {
  moduloNotificaciones ??= pushDisponible
    ? import('expo-notifications')
        .then((Notifications) => {
          Notifications.setNotificationHandler({
            handleNotification: async (notificacion) => {
              // El aviso fijo de la atención en curso no suena ni salta: es un recordatorio, no una alerta.
              const fijo = notificacion.request.content.data?.tipo === TIPO_ATENCION_EN_CURSO
              return {
                // Con la app abierta, el push de un incidente nuevo también se muestra.
                shouldShowBanner: !fijo,
                shouldShowList: true,
                shouldPlaySound: !fijo,
                shouldSetBadge: false,
              }
            },
          })
          return Notifications
        })
        .catch(() => null)
    : Promise.resolve(null)
  return moduloNotificaciones
}

/**
 * PB-03 R3: registra el token de FCM del teléfono para recibir los incidentes nuevos con la app cerrada. Un
 * dispositivo nuevo reemplaza al anterior. Sin push disponible no hace nada.
 */
export async function registrarDispositivo(paramedicoId: number) {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return
  }
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

export async function actualizarTokenDelDispositivo(paramedicoId: number, token: DevicePushToken) {
  try {
    await servicioApi.registrarDispositivo(paramedicoId, String(token.data))
  } catch {
    // Se vuelve a registrar la próxima vez que se abra la app.
  }
}

const respuestasAtendidas = new Set<string>()

/** Al tocar el push, abre el incidente. El backend manda su id en el campo `incidenteId` del mensaje. */
export function abrirIncidenteDeNotificacion(respuesta: NotificationResponse) {
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
