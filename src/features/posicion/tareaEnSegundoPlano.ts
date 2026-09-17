import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

import { leerParamedicoGuardado } from '@/features/servicio/almacen'

import { coordenadasDe, INTERVALO_ENVIO_MS, registrarPosicion } from './envioDePosicion'

export const TAREA_POSICION_EN_SERVICIO = 'sga-posicion-en-servicio'

type DatosTareaPosicion = { locations: Location.LocationObject[] }

// Se define en el ámbito global (lo importa index.ts): el sistema puede abrir la app solo para ejecutar la tarea.
try {
  TaskManager.defineTask<DatosTareaPosicion>(TAREA_POSICION_EN_SERVICIO, async ({ data, error }) => {
    if (error || !data?.locations?.length) {
      return
    }
    const paramedico = await leerParamedicoGuardado()
    if (!paramedico) {
      return
    }
    await registrarPosicion(paramedico.id, coordenadasDe(data.locations[data.locations.length - 1]))
  })
} catch {
  // Expo Go no ejecuta tareas en segundo plano: queda solo el envío con la app abierta.
}

let permisoDeFondoPedido = false

/**
 * Sigue enviando la posición con la app en segundo plano si el paramédico dio el permiso "siempre". Solo funciona en
 * un development build; en Expo Go no hace nada.
 */
export async function iniciarEnvioEnSegundoPlano() {
  try {
    if (!(await TaskManager.isAvailableAsync())) {
      return
    }
    let permiso = await Location.getBackgroundPermissionsAsync()
    if (!permiso.granted && permiso.canAskAgain && !permisoDeFondoPedido) {
      // En Android 11 o superior esto abre los ajustes del sistema: se pide una sola vez por apertura de la app.
      permisoDeFondoPedido = true
      permiso = await Location.requestBackgroundPermissionsAsync()
    }
    if (!permiso.granted || (await Location.hasStartedLocationUpdatesAsync(TAREA_POSICION_EN_SERVICIO))) {
      return
    }
    await Location.startLocationUpdatesAsync(TAREA_POSICION_EN_SERVICIO, {
      accuracy: Location.Accuracy.High,
      timeInterval: INTERVALO_ENVIO_MS,
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'En servicio',
        notificationBody: 'Se comparte la posición de tu ambulancia.',
        notificationColor: '#D92D20',
      },
    })
  } catch {
    // Sin soporte o sin permiso: la posición se sigue enviando mientras la app esté abierta.
  }
}

export async function detenerEnvioEnSegundoPlano() {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TAREA_POSICION_EN_SERVICIO)) {
      await Location.stopLocationUpdatesAsync(TAREA_POSICION_EN_SERVICIO)
    }
  } catch {
    // Nada que detener.
  }
}
