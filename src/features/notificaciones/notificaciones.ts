import { isRunningInExpoGo } from 'expo'
import { router } from 'expo-router'
import type { DevicePushToken, Notification, NotificationResponse } from 'expo-notifications'
import { Platform } from 'react-native'

import { atencionActivaQuery, atencionKeys, pasajeroDelTraslado } from '@/features/atencion/queries'
import {
  avisarTrasladoRetirado,
  seEstaAvisandoElRetiro,
  type MotivoDelRetiro,
} from '@/features/atencion/trasladoRetirado'
import { servicioApi } from '@/features/servicio/api'
import { servicioKeys } from '@/features/servicio/queries'
import { irAInicio } from '@/shared/navegacion/inicio'
import { queryClient } from '@/shared/query/queryClient'

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
    await servicioApi.registrarDispositivo(String(token.data))
  } catch {
    // Sin push disponible: los incidentes igual llegan en tiempo real con la app abierta.
  }
}

export async function actualizarTokenDelDispositivo(paramedicoId: number, token: DevicePushToken) {
  try {
    await servicioApi.registrarDispositivo(String(token.data))
  } catch {
    // Se vuelve a registrar la próxima vez que se abra la app.
  }
}

/** Lo que el backend pone en `tipo` cuando le saca el traslado a la unidad. */
function motivoDelRetiro(tipo: unknown): MotivoDelRetiro | null {
  switch (tipo) {
    case 'TRASLADO_CANCELADO':
      return 'CANCELADA_POR_SOLICITANTE'
    case 'TRASLADO_REASIGNADO':
      return 'REASIGNADA'
    default:
      return null
  }
}

/**
 * Un push de traslado dice que la atención de la unidad cambió en el servidor: le asignaron un traslado o se lo
 * sacaron. Se vuelve a pedir en el acto, para que el cambio se vea sin salir de la app y volver a entrar, y si se lo
 * sacaron se avisa por qué. Devuelve si el push era de un traslado.
 */
function actualizarPorTraslado(datos: Record<string, unknown> | undefined, paramedicoId: number) {
  const trasladoId = datos?.trasladoId
  if (typeof trasladoId !== 'string' && typeof trasladoId !== 'number') {
    return false
  }
  const motivo = motivoDelRetiro(datos?.tipo)
  if (motivo) {
    const id = Number(trasladoId)
    // Antes de volver a pedir la atención: después ya no está en la caché, y con ella se va el nombre del pasajero.
    const activa = queryClient.getQueryData(atencionActivaQuery(paramedicoId).queryKey)
    // Se avisa si era el traslado que la app mostraba, o si todavía no sabe nada porque se abrió con el toque. Un
    // push que llega tarde, con la unidad ya en otra cosa, diría que quedó libre cuando no es así.
    if (activa === undefined || activa?.traslado?.id === id || seEstaAvisandoElRetiro(id)) {
      avisarTrasladoRetirado({ trasladoId: id, motivo, pasajero: pasajeroDelTraslado(queryClient, paramedicoId, id) })
    }
  }
  void queryClient.invalidateQueries({ queryKey: atencionKeys.activa(paramedicoId) })
  void queryClient.invalidateQueries({ queryKey: atencionKeys.misTraslados })
  // Con la atención cambia también la unidad: pasa a estar en atención o vuelve a quedar disponible.
  void queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
  return true
}

/** Push que llega con la app abierta. El aviso lo muestra el sistema; acá se refresca lo que cambió. */
export function recibirNotificacion(notificacion: Notification, paramedicoId: number) {
  actualizarPorTraslado(notificacion.request.content.data, paramedicoId)
}

const respuestasAtendidas = new Set<string>()

/**
 * Al tocar el push, abre lo que el aviso trae: el incidente si vino de una emergencia, o el inicio si vino de un
 * traslado, porque el traslado asignado se atiende desde ahí igual que cualquier atención en curso. Si se lo
 * sacaron, ahí mismo se ve el aviso de por qué.
 */
export function abrirIncidenteDeNotificacion(respuesta: NotificationResponse, paramedicoId: number) {
  const identificador = respuesta.notification.request.identifier
  if (respuestasAtendidas.has(identificador)) {
    return
  }
  respuestasAtendidas.add(identificador)
  const datos = respuesta.notification.request.content.data
  const incidenteId = datos?.incidenteId
  if (typeof incidenteId === 'string' || typeof incidenteId === 'number') {
    router.push({ pathname: '/incidente/[id]', params: { id: String(incidenteId) } })
    return
  }
  if (actualizarPorTraslado(datos, paramedicoId)) {
    irAInicio()
  }
}
