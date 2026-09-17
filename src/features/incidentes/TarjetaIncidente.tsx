import Feather from '@expo/vector-icons/Feather'
import { Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { formatearDistancia } from '@/shared/formato/distancia'
import { duracionDesde } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import { textoAfectados, textoUnidadesAcudiendo, type IncidenteCercano } from './cercania'

type Props = IncidenteCercano & {
  ahora: number
  destacada?: boolean
  onPress: () => void
}

/** PB-03 R2: distancia, afectados, lo que reportaron, tiempo desde la creación y unidades que ya acuden. */
export function TarjetaIncidente({ incidente, distanciaM, ahora, destacada = false, onPress }: Props) {
  const tema = useTheme()
  const distancia = distanciaM === null ? null : formatearDistancia(distanciaM)
  const descripcion = incidente.descripciones[0]
  const afectados = textoAfectados(incidente.cantidadAfectados)

  return (
    <XStack
      role="button"
      aria-label={`${afectados}${distancia ? `, a ${distancia.valor} ${distancia.unidad}` : ''}`}
      items="center"
      gap={12}
      p={14}
      rounded={14}
      borderWidth={1}
      borderColor={destacada ? '$primarioTinte' : '$borde'}
      bg={destacada ? '$primarioTinte' : '$superficie'}
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      <YStack width={56} shrink={0} items="center" justify="center">
        <Text color="$texto" fontSize={18} fontWeight="600">
          {distancia?.valor ?? '—'}
        </Text>
        <Text color="$textoSecundario" fontSize={12}>
          {distancia ? (distancia.unidad === 'm' ? 'metros' : 'km') : 'sin GPS'}
        </Text>
      </YStack>

      <YStack width={1} self="stretch" bg="$borde" />

      <YStack flex={1} minW={0} gap={4}>
        <Text color="$texto" fontSize={15} fontWeight="600">
          {afectados}
        </Text>
        {descripcion ? (
          <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18} numberOfLines={1}>
            {descripcion}
          </Paragraph>
        ) : null}
        <XStack items="center" gap={8} flexWrap="wrap">
          <Text color="$textoSecundario" fontSize={12}>
            {`Hace ${duracionDesde(incidente.fechaHoraCreacion, ahora)}${
              incidente.unidadesAcudiendo > 0 ? '' : ' · sin unidades'
            }`}
          </Text>
          {incidente.unidadesAcudiendo > 0 ? (
            <Insignia tono="ambar" alto={22}>
              {textoUnidadesAcudiendo(incidente.unidadesAcudiendo)}
            </Insignia>
          ) : null}
        </XStack>
      </YStack>

      <Feather name="chevron-right" size={18} color={tema.textoTenue?.val} />
    </XStack>
  )
}
