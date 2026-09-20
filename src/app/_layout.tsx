import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium'
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular'
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium'
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TamaguiProvider, ToastProvider, ToastViewport } from 'tamagui'

import { paramedicoGuardadoQuery } from '@/features/servicio/queries'
import { TareasEnServicio } from '@/features/servicio/TareasEnServicio'
import { queryClient, useFocoDeLaApp } from '@/shared/query/queryClient'
import { ToastActual } from '@/shared/ui/ToastActual'
import { tamaguiConfig } from '@/tamagui.config'
import { coloresClaro, coloresOscuro } from '@/tema/colores'

SplashScreen.preventAutoHideAsync()

const navegacionClara: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: coloresClaro.primario,
    background: coloresClaro.fondo,
    card: coloresClaro.superficie,
    text: coloresClaro.texto,
    border: coloresClaro.borde,
  },
}

const navegacionOscura: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: coloresOscuro.primario,
    background: coloresOscuro.fondo,
    card: coloresOscuro.superficie,
    text: coloresOscuro.texto,
    border: coloresOscuro.borde,
  },
}

export default function LayoutRaiz() {
  // React Native 0.86 puede devolver 'unspecified': Tamagui necesita siempre 'light' o 'dark'.
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const margenes = useSafeAreaInsets()
  const [fuentesListas, errorFuentes] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_500Medium,
  })
  useFocoDeLaApp()

  if (!fuentesListas && !errorFuentes) {
    return null
  }

  return (
    // QueryClientProvider va por fuera de Tamagui para que lo vea el contenido de Sheet y Dialog, que se pinta en un portal.
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={esquema}>
        <ThemeProvider value={esquema === 'dark' ? navegacionOscura : navegacionClara}>
          <ToastProvider duration={4000} swipeDirection="up">
            <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
            <Pantallas />
            <ToastActual />
            <ToastViewport flexDirection="column-reverse" t={margenes.top + 8} l={0} r={0} />
          </ToastProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}

/** Sin identificación solo existe esa pantalla. Al identificarse, el guard cambia y el router lleva al mapa. */
function Pantallas() {
  const paramedico = useQuery(paramedicoGuardadoQuery())
  const listo = !paramedico.isPending

  useEffect(() => {
    if (listo) {
      SplashScreen.hide()
    }
  }, [listo])

  if (!listo) {
    return null
  }

  const identificado = paramedico.data != null

  return (
    <>
      {paramedico.data ? <TareasEnServicio paramedicoId={paramedico.data.id} /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={identificado}>
          <Stack.Screen name="index" />
          <Stack.Screen name="incidente/[id]" />
          <Stack.Screen name="atencion/entrega" />
          <Stack.Screen name="atencion/paciente" />
          <Stack.Screen name="atencion/cierre" />
          <Stack.Screen name="demo/index" />
          <Stack.Screen name="demo/recorrido" />
        </Stack.Protected>
        <Stack.Protected guard={!identificado}>
          <Stack.Screen name="identificacion" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
