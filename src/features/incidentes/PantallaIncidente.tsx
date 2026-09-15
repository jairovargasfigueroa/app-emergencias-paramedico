import Feather from '@expo/vector-icons/Feather'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { usePosicionActual } from '@/features/posicion/posicionActual'
import { distanciaEnMetros, formatearDistancia } from '@/shared/formato/distancia'
import { duracionDesde } from '@/shared/formato/tiempo'
import { DELTA_CALLE, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import type { IncidenteAbierto } from './api'
import { textoAfectados } from './cercania'
import { useIncidentesAbiertos } from './incidentesAbiertos'
import { MarcadorIncidente } from './MarcadorIncidente'

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

/** PB-03 CA-05: todo lo que se sabe del incidente antes de decidir si acudir. */
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
      <PantallaDeEstado titulo="Este incidente ya se cerró" descripcion="Ya no está abierto, así que no aparece en el mapa.">
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

  const distancia = posicion ? formatearDistancia(distanciaEnMetros(posicion, incidente)) : null
  const tiempo = duracionDesde(incidente.fechaHoraCreacion, ahora)
  const acuden =
    incidente.unidadesAcudiendo === 0
      ? 'Ninguna'
      : incidente.unidadesAcudiendo === 1
        ? '1 unidad'
        : `${incidente.unidadesAcudiendo} unidades`

  return (
    <YStack flex={1} bg="$fondo">
      <YStack height="42%">
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
          <MarcadorIncidente incidente={incidente} destacado />
        </MapView>
        <Button
          position="absolute"
          t={margenes.top + 12}
          l={16}
          width={44}
          height={44}
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
          <YStack gap={4}>
            <Text color="$textoSecundario" fontSize={13}>
              {`Incidente${distancia ? ` a ${distancia.valor} ${distancia.unidad}` : ''} · creado hace ${tiempo}`}
            </Text>
            <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
              {textoAfectados(incidente.cantidadAfectados)}
            </H1>
          </YStack>

          <XStack gap={10}>
            <Dato etiqueta="Distancia" valor={distancia ? `${distancia.valor} ${distancia.unidad}` : '—'} />
            <Dato etiqueta="Tiempo" valor={tiempo} />
            <Dato etiqueta="Acuden" valor={acuden} />
          </XStack>

          <YStack gap={10}>
            <Text color="$texto" fontSize={14} fontWeight="600">
              Lo que reportaron
            </Text>
            {incidente.descripciones.length === 0 ? (
              <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
                Nadie describió lo que pasó.
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
        </ScrollView>

        {acciones ? (
          <YStack px={20} pt={12} pb={margenes.bottom + 16} gap={10} borderTopWidth={1} borderColor="$borde">
            {acciones}
          </YStack>
        ) : (
          <YStack height={margenes.bottom} />
        )}
      </YStack>
    </YStack>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <YStack flex={1} minW={0} gap={2} p={12} rounded={12} bg="$fondo">
      <Text color="$textoSecundario" fontSize={12}>
        {etiqueta}
      </Text>
      <Text color="$texto" fontSize={17} fontWeight="600" numberOfLines={1}>
        {valor}
      </Text>
    </YStack>
  )
}
