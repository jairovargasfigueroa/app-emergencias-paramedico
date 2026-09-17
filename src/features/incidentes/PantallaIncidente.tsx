import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { usePosicionActual } from '@/features/posicion/posicionActual'
import { distanciaEnMetros, formatearDistancia } from '@/shared/formato/distancia'
import { duracionLarga } from '@/shared/formato/tiempo'
import { DELTA_CALLE, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import { estaAbandonado } from './abandono'
import type { IncidenteAbierto } from './api'
import { textoPersonasAfectadas, textoUnidadesEnCamino } from './cercania'
import { tituloDelLugar } from './direcciones'
import { useIncidentesAbiertos } from './incidentesAbiertos'
import { MarcadorIncidente } from './MarcadorIncidente'
import { direccionIncidenteQuery } from './queries'

export function volverAlMapa() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

type Props = {
  /** Acciones al pie del detalle, por ejemplo tomar el incidente (PB-04). */
  acciones?: (incidente: IncidenteAbierto) => ReactNode
}

/** PB-03 CA-05: todo lo que se sabe de la emergencia antes de decidir si acudir. */
export function PantallaIncidente({ acciones }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { cargando, incidentes } = useIncidentesAbiertos()
  const incidente = incidentes.find((abierto) => abierto.id === Number(id))

  if (cargando) {
    return <PantallaDeEstado cargando />
  }

  if (!incidente) {
    // PB-03 R6: al pasar a un estado final, el incidente deja de publicarse.
    return (
      <PantallaDeEstado titulo="Esta emergencia ya se cerró" descripcion="Ya no está abierta, así que no aparece en el mapa.">
        <BotonPrincipal onPress={volverAlMapa}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Volver al mapa
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  return <DetalleIncidente incidente={incidente} acciones={acciones?.(incidente)} />
}

function DetalleIncidente({ incidente, acciones }: { incidente: IncidenteAbierto; acciones: ReactNode }) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const posicion = usePosicionActual()
  const ahora = useAhora()
  const direccion = useQuery(direccionIncidenteQuery(incidente)).data

  const distancia = posicion ? formatearDistancia(distanciaEnMetros(posicion, incidente)) : null
  const tiempo = `hace ${duracionLarga(incidente.fechaHoraCreacion, ahora)}`
  const acuden = textoUnidadesEnCamino(incidente.unidadesAcudiendo)

  return (
    <YStack flex={1} bg="$fondo">
      <YStack height="38%">
        <MapView
          style={{ flex: 1 }}
          initialRegion={regionAlrededorDe(incidente, DELTA_CALLE)}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          userInterfaceStyle={esquema}
        >
          <MarcadorIncidente incidente={incidente} destacado abandonado={estaAbandonado(incidente, ahora)} />
        </MapView>
        <Button
          position="absolute"
          t={margenes.top + 12}
          l={16}
          width={48}
          height={48}
          p={0}
          rounded={999}
          bg="$superficie"
          borderWidth={0}
          elevation={4}
          aria-label="Volver al mapa"
          onPress={volverAlMapa}
        >
          <Feather name="chevron-left" size={24} color={tema.texto?.val} />
        </Button>
      </YStack>

      <YStack flex={1} mt={-22} borderTopLeftRadius={22} borderTopRightRadius={22} bg="$superficie" overflow="hidden">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
          <YStack gap={5}>
            {/* El título es el lugar: es lo primero que necesita para decidir. */}
            <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
              {tituloDelLugar(direccion, distancia)}
            </H1>
            <Text color="$textoSecundario" fontSize={15} lineHeight={21}>
              {distancia ? `A ${distancia.valor} ${distancia.unidad} en línea recta · ${tiempo}` : tiempo}
            </Text>
          </YStack>

          {/* Lo decisivo arriba del todo: si ya va alguien y cuántos afectados hay (PB-03 R2). */}
          <YStack gap={4} px={14} py={12} rounded={12} bg="$fondo">
            <Text color="$texto" fontSize={17} lineHeight={22} fontWeight="600">
              {acuden.charAt(0).toUpperCase() + acuden.slice(1)}
            </Text>
            <Text color="$textoSecundario" fontSize={15} lineHeight={21}>
              {textoPersonasAfectadas(incidente.cantidadAfectados)}
            </Text>
          </YStack>

          <YStack gap={10}>
            <Text color="$texto" fontSize={14} fontWeight="600">
              Lo que reportaron
            </Text>
            {incidente.descripciones.length === 0 ? (
              <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
                Todavía no dijeron qué pasó.
              </Paragraph>
            ) : (
              incidente.descripciones.map((descripcion, indice) => (
                <Paragraph
                  key={indice}
                  color="$texto"
                  fontSize={15}
                  lineHeight={22}
                  px={14}
                  py={12}
                  rounded={12}
                  borderWidth={1}
                  borderColor="$borde"
                >
                  {descripcion}
                </Paragraph>
              ))
            )}
          </YStack>

          {/* Aire antes del pie: el botón no queda donde el dedo acaba de tocar la tarjeta para entrar. */}
          <YStack height={24} />
        </ScrollView>

        {acciones ? (
          <XStack px={20} pt={20} pb={margenes.bottom + 16} borderTopWidth={1} borderColor="$borde">
            <YStack flex={1} gap={10}>
              {acciones}
            </YStack>
          </XStack>
        ) : (
          <YStack height={margenes.bottom} />
        )}
      </YStack>
    </YStack>
  )
}
