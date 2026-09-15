import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H2, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import type { Ambulancia } from '@/features/servicio/api'
import { AvisoFueraDeServicio } from '@/features/servicio/AvisoFueraDeServicio'
import { EstadoAmbulancia } from '@/features/servicio/EstadoAmbulancia'
import { CENTRO_POR_DEFECTO, DELTA_BARRIO, DELTA_CIUDAD, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'

import { ordenarPorCercania } from './cercania'
import { useIncidentesAbiertos } from './incidentesAbiertos'
import { MarcadorIncidente } from './MarcadorIncidente'
import { TarjetaIncidente } from './TarjetaIncidente'

type Props = {
  ambulancia: Ambulancia
  nombreParamedico: string
}

function abrirIncidente(id: number) {
  router.push({ pathname: '/incidente/[id]', params: { id: String(id) } })
}

function tituloLista(cantidad: number) {
  if (cantidad === 0) {
    return 'Sin incidentes abiertos'
  }
  return cantidad === 1 ? '1 incidente abierto' : `${cantidad} incidentes abiertos`
}

/**
 * PB-03 CA-01 a CA-03 y CA-06: todos los incidentes abiertos en el mapa y en la lista, del más cercano al más lejano,
 * actualizados en tiempo real.
 */
export function MapaDeIncidentes({ ambulancia, nombreParamedico }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const mapa = useRef<MapView>(null)
  const posicion = usePosicionActual()
  const { cargando, error, incidentes } = useIncidentesAbiertos()
  const ahora = useAhora()

  const [regionInicial] = useState(() => {
    const conocida = leerPosicionActual()
    return regionAlrededorDe(conocida ?? CENTRO_POR_DEFECTO, conocida ? DELTA_BARRIO : DELTA_CIUDAD)
  })
  const centradoEnPosicion = useRef(leerPosicionActual() !== null)
  const [mapaListo, setMapaListo] = useState(false)

  useEffect(() => {
    // La primera vez que llega la posición, el mapa se centra en el paramédico. Antes de onMapReady no hay que moverlo.
    if (mapaListo && posicion && !centradoEnPosicion.current) {
      centradoEnPosicion.current = true
      mapa.current?.animateToRegion(regionAlrededorDe(posicion, DELTA_BARRIO), 600)
    }
  }, [mapaListo, posicion])

  const ordenados = ordenarPorCercania(incidentes, posicion)
  const conDistancia = posicion !== null

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={regionInicial}
        onMapReady={() => setMapaListo(true)}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={esquema}
      >
        {ordenados.map(({ incidente }, indice) => (
          <MarcadorIncidente
            key={incidente.id}
            incidente={incidente}
            destacado={indice === 0 && conDistancia}
            onPress={() => abrirIncidente(incidente.id)}
          />
        ))}
      </MapView>

      <YStack position="absolute" t={margenes.top + 12} l={16} r={16} gap={10}>
        <XStack
          items="center"
          justify="space-between"
          gap={12}
          px={14}
          py={12}
          rounded={16}
          bg="$superficie"
          shadowColor="#000000"
          shadowOpacity={0.12}
          shadowRadius={24}
          shadowOffset={{ width: 0, height: 8 }}
          elevation={6}
        >
          <YStack gap={2} flex={1} minW={0}>
            <Text color="$texto" fontFamily="$mono" fontSize={16} fontWeight="500">
              {ambulancia.placa}
            </Text>
            <Text color="$textoSecundario" fontSize={13} numberOfLines={1}>
              {`${nombreParamedico} · en servicio`}
            </Text>
          </YStack>
          <EstadoAmbulancia estado={ambulancia.estado} />
        </XStack>
        {ambulancia.estado === 'FUERA_DE_SERVICIO' ? <AvisoFueraDeServicio ambulanciaId={ambulancia.id} /> : null}
      </YStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        maxH="55%"
        gap={12}
        px={16}
        pt={12}
        pb={margenes.bottom + 16}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
      >
        <YStack self="center" width={40} height={5} rounded={999} bg="$borde" />
        <XStack items="baseline" justify="space-between" gap={12} px={4}>
          <H2 color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
            {cargando ? 'Incidentes abiertos' : tituloLista(ordenados.length)}
          </H2>
          <Text color="$textoSecundario" fontSize={13}>
            {conDistancia ? 'Por cercanía' : 'Esperando tu ubicación'}
          </Text>
        </XStack>

        {cargando ? (
          <XStack items="center" justify="center" gap={10} py={24}>
            <Spinner color="$primario" />
            <Paragraph color="$textoSecundario" fontSize={14}>
              Conectando…
            </Paragraph>
          </XStack>
        ) : error ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} px={4} py={16}>
            No pudimos recibir los incidentes en tiempo real. Revisa tu conexión.
          </Paragraph>
        ) : ordenados.length === 0 ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} px={4} py={16}>
            Los incidentes nuevos aparecerán aquí al instante.
          </Paragraph>
        ) : (
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10 }}>
            {ordenados.map((cercano, indice) => (
              <TarjetaIncidente
                key={cercano.incidente.id}
                {...cercano}
                ahora={ahora}
                destacada={indice === 0 && conDistancia}
                onPress={() => abrirIncidente(cercano.incidente.id)}
              />
            ))}
          </ScrollView>
        )}
      </YStack>
    </YStack>
  )
}
