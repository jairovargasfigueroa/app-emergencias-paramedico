import NetInfo from '@react-native-community/netinfo'
import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState, Platform, type AppStateStatus } from 'react-native'

import { ErrorApi } from '@/shared/api/cliente'
import { cerrarSesion } from '@/shared/sesion/queries'

// TanStack Query pausa y reanuda las peticiones según la conexión del teléfono.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((estado) => {
    setOnline(estado.isConnected !== false)
  }),
)

/** Un 4xx es una respuesta definitiva del backend: reintentarla no cambia nada. */
function esErrorDefinitivo(error: unknown) {
  return error instanceof ErrorApi && error.status >= 400 && error.status < 500
}

/**
 * Un 401 es el token vencido o una sesión que el servidor ya no reconoce, como la que se cierra cuando la central le
 * genera un código de activación al paramédico. Se cierra acá, en un solo lugar y borrando lo mismo que al salir a
 * mano, y el guard del router devuelve a la pantalla de identificación.
 */
function alFallarPeticion(error: unknown) {
  if (error instanceof ErrorApi && error.status === 401) {
    void cerrarSesion(queryClient)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: alFallarPeticion }),
  mutationCache: new MutationCache({ onError: alFallarPeticion }),
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (fallos, error) => !esErrorDefinitivo(error) && fallos < 2,
    },
  },
})

function alCambiarEstadoApp(estado: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(estado === 'active')
  }
}

/** Refresca las consultas al volver a la app, como hace el navegador al recuperar el foco. */
export function useFocoDeLaApp() {
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', alCambiarEstadoApp)
    return () => suscripcion.remove()
  }, [])
}
