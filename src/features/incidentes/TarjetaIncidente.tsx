import { useQuery } from '@tanstack/react-query'
import type { LayoutChangeEvent } from 'react-native'
import { Paragraph, Text, XStack, YStack } from 'tamagui'

import { formatearDistancia } from '@/shared/formato/distancia'
import { duracionDesde, duracionLarga } from '@/shared/formato/tiempo'

import { estaAbandonado } from './abandono'
import { textoUnidadesEnCamino, type IncidenteCercano } from './cercania'
import { tituloDelLugar } from './direcciones'
import { direccionIncidenteQuery } from './queries'

type Props = IncidenteCercano & {
  ahora: number
  seleccionada?: boolean
  onLayout?: (evento: LayoutChangeEvent) => void
  onPress: () => void
}

/** PB-03 R2: el lugar primero, después hace cuánto y si va alguien, y por último lo que reportaron. */
export function TarjetaIncidente({ incidente, distanciaM, ahora, seleccionada = false, onLayout, onPress }: Props) {
  const direccion = useQuery(direccionIncidenteQuery(incidente)).data
  const distancia = distanciaM === null ? null : formatearDistancia(distanciaM)
  const titulo = tituloDelLugar(direccion, distancia)
  const descripcion = incidente.descripciones[0]
  const abandonado = estaAbandonado(incidente, ahora)

  return (
    <XStack
      role="button"
      aria-label={titulo}
      aria-selected={seleccionada}
      items="center"
      gap={12}
      p={seleccionada ? 13 : 14}
      rounded={14}
      borderWidth={seleccionada ? 2 : 1}
      borderColor={seleccionada ? '$primario' : abandonado ? '$enAtencion' : '$borde'}
      bg={abandonado ? '$enAtencionTinte' : '$superficie'}
      pressStyle={{ opacity: 0.8 }}
      onLayout={onLayout}
      onPress={onPress}
    >
      <YStack width={62} shrink={0} items="center" justify="center">
        <Text color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
          {distancia?.valor ?? '—'}
        </Text>
        <Text color="$textoSecundario" fontSize={11} lineHeight={15} text="center">
          {distancia ? (distancia.unidad === 'm' ? 'metros' : 'km') : 'sin GPS'}
        </Text>
        {distancia ? (
          <Text color="$textoSecundario" fontSize={11} lineHeight={15} text="center">
            en línea recta
          </Text>
        ) : null}
      </YStack>

      <YStack width={1} self="stretch" bg="$borde" />

      <YStack flex={1} minW={0} gap={3}>
        <Text color="$texto" fontSize={17} lineHeight={22} fontWeight="600" numberOfLines={2}>
          {titulo}
        </Text>
        {abandonado ? (
          <Text color="$enAtencionTexto" fontSize={14} lineHeight={19} fontWeight="600">
            {`Sin unidades hace ${duracionLarga(incidente.fechaHoraCreacion, ahora)}`}
          </Text>
        ) : (
          <Text color="$textoSecundario" fontSize={14} lineHeight={19}>
            {`Hace ${duracionDesde(incidente.fechaHoraCreacion, ahora)} · ${textoUnidadesEnCamino(
              incidente.unidadesAcudiendo,
            )}`}
          </Text>
        )}
        {descripcion ? (
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={20} numberOfLines={1}>
            {`«${descripcion}»`}
          </Paragraph>
        ) : null}
      </YStack>
    </XStack>
  )
}
