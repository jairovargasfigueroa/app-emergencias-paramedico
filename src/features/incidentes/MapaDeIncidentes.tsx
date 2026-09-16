import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, useColorScheme, type ScrollView } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H2, Paragraph, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import type { Ambulancia } from '@/features/servicio/api'
import { TarjetaDeTurno } from '@/features/servicio/TarjetaDeTurno'
import { CENTRO_POR_DEFECTO, DELTA_BARRIO, DELTA_CIUDAD, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'

import { estaAbandonado } from './abandono'
import { ordenarPorCercania } from './cercania'
import { useIncidentesAbiertos } from './incidentesAbiertos'
import { MarcadorIncidente } from './MarcadorIncidente'
import { TarjetaIncidente } from './TarjetaIncidente'

/** Alturas de la hoja, de la más alta a la más baja: así las quiere `snapPoints`. */
const ALTURAS = [84, 48, 15]
const COMPLETA = 0
const MEDIA = 1
const ASOMADA = 2

type Props = {
  ambulancia: Ambulancia
  nombreParamedico: string
}

function abrirIncidente(id: number) {
  router.push({ pathname: '/incidente/[id]', params: { id: String(id) } })
}

function tituloLista(cantidad: number) {
  if (cantidad === 0) {
    return 'Sin emergencias abiertas'
  }
  return cantidad === 1 ? '1 emergencia abierta' : `${cantidad} emergencias abiertas`
}

/**
 * PB-03 CA-01 a CA-03 y CA-06: todas las emergencias abiertas en el mapa y en la lista, de la más cercana a la más
 * lejana, actualizadas en tiempo real. La hoja se arrastra entre tres alturas y arranca según cuántas haya.
 */
export function MapaDeIncidentes({ ambulancia, nombreParamedico }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const mapa = useRef<MapView>(null)
  const lista = useRef<ScrollView>(null)
  /** Dónde empieza cada tarjeta dentro de la lista, para traer a la vista la del marcador tocado. */
  const desplazamientos = useRef(new Map<number, number>())
  const posicion = usePosicionActual()
  const { cargando, error, incidentes } = useIncidentesAbiertos()
  const ahora = useAhora()

  const [regionInicial] = useState(() => {
    const conocida = leerPosicionActual()
    return regionAlrededorDe(conocida ?? CENTRO_POR_DEFECTO, conocida ? DELTA_BARRIO : DELTA_CIUDAD)
  })
  const centradoEnPosicion = useRef(leerPosicionActual() !== null)
  const [mapaListo, setMapaListo] = useState(false)
  const [altura, setAltura] = useState(ASOMADA)
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const habiaIncidentes = useRef(false)

  useEffect(() => {
    // La primera vez que llega la posición, el mapa se centra en el paramédico. Antes de onMapReady no hay que moverlo.
    if (mapaListo && posicion && !centradoEnPosicion.current) {
      centradoEnPosicion.current = true
      mapa.current?.animateToRegion(regionAlrededorDe(posicion, DELTA_BARRIO), 600)
    }
  }, [mapaListo, posicion])

  const hayIncidentes = incidentes.length > 0

  useEffect(() => {
    // Sin nada que mostrar la hoja se queda asomada; en cuanto entra la primera emergencia sube sola a media altura.
    if (hayIncidentes && !habiaIncidentes.current) {
      setAltura(MEDIA)
    }
    habiaIncidentes.current = hayIncidentes
  }, [hayIncidentes])

  function seleccionar(incidenteId: number) {
    setSeleccionado(incidenteId)
    setAltura((actual) => (actual === ASOMADA ? MEDIA : actual))
    const y = desplazamientos.current.get(incidenteId)
    if (y !== undefined) {
      lista.current?.scrollTo({ y: Math.max(0, y - 8), animated: true })
    }
  }

  const ordenados = ordenarPorCercania(incidentes, posicion)
  const conDistancia = posicion !== null

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={regionInicial}
        onMapReady={() => setMapaListo(true)}
        onPress={() => setSeleccionado(null)}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={esquema}
      >
        {ordenados.map(({ incidente }) => (
          <MarcadorIncidente
            key={incidente.id}
            incidente={incidente}
            destacado={seleccionado === incidente.id}
            abandonado={estaAbandonado(incidente, ahora)}
            onPress={() => seleccionar(incidente.id)}
          />
        ))}
      </MapView>

      <YStack position="absolute" t={margenes.top + 12} l={16} r={16}>
        <TarjetaDeTurno ambulancia={ambulancia} nombreParamedico={nombreParamedico} />
      </YStack>

      {/* Hoja fija sobre el mapa: no se cierra nunca, solo cambia de altura. */}
      <Sheet
        open
        modal={false}
        snapPoints={ALTURAS}
        snapPointsMode="percent"
        position={altura}
        onPositionChange={setAltura}
        dismissOnSnapToBottom={false}
        dismissOnOverlayPress={false}
        zIndex={5}
      >
        <Sheet.Frame
          adjustPaddingForOffscreenContent
          gap={12}
          px={16}
          pt={8}
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
          <YStack
            role="button"
            aria-label={altura === COMPLETA ? 'Bajar la lista' : 'Subir la lista'}
            items="center"
            py={6}
            onPress={() => setAltura(altura === COMPLETA ? ASOMADA : altura - 1)}
          >
            <YStack width={40} height={5} rounded={999} bg="$bordeFuerte" />
          </YStack>

          <XStack items="baseline" justify="space-between" gap={12} px={4}>
            <H2 color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
              {cargando ? 'Emergencias abiertas' : tituloLista(ordenados.length)}
            </H2>
            <Text color="$textoSecundario" fontSize={13}>
              {conDistancia ? 'por cercanía' : 'esperando tu ubicación'}
            </Text>
          </XStack>

          {cargando ? (
            <XStack items="center" gap={10} px={4} py={12}>
              <Spinner color="$primario" />
              <Paragraph color="$textoSecundario" fontSize={15}>
                Conectando…
              </Paragraph>
            </XStack>
          ) : error ? (
            <Paragraph color="$textoSecundario" fontSize={15} lineHeight={21} px={4} py={12}>
              No pudimos recibir las emergencias en tiempo real. Revisa tu conexión.
            </Paragraph>
          ) : ordenados.length === 0 ? (
            <Paragraph color="$textoSecundario" fontSize={15} lineHeight={21} px={4} py={12}>
              Te avisamos apenas entre una, aunque tengas la app cerrada.
            </Paragraph>
          ) : (
            <Sheet.ScrollView ref={lista} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {ordenados.map((cercano) => (
                <TarjetaIncidente
                  key={cercano.incidente.id}
                  {...cercano}
                  ahora={ahora}
                  seleccionada={seleccionado === cercano.incidente.id}
                  onLayout={(evento) => desplazamientos.current.set(cercano.incidente.id, evento.nativeEvent.layout.y)}
                  onPress={() => abrirIncidente(cercano.incidente.id)}
                />
              ))}
            </Sheet.ScrollView>
          )}
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
