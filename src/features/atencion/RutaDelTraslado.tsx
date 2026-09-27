import { Text, XStack, YStack } from 'tamagui'

type Props = {
  origen: string
  destino: string
  /** Segunda línea del destino: el detalle que dio quien pidió, por ejemplo "consultorio 3". */
  destinoDetalle?: string | null
}

/**
 * De dónde a dónde, en dos líneas. En una sola el corte cae justo donde está lo que se busca —el nombre del
 * hospital— y hay que abrir el detalle para leerlo. El riel de puntos es el mismo de los hitos: acá también es
 * una secuencia, primero uno y después el otro.
 */
export function RutaDelTraslado({ origen, destino, destinoDetalle }: Props) {
  return (
    <XStack gap={12}>
      <YStack items="center" pt={6}>
        <YStack width={10} height={10} rounded={999} borderWidth={2} borderColor="$bordeFuerte" />
        <YStack width={2} flex={1} minH={14} bg="$borde" />
        <YStack width={10} height={10} rounded={999} bg="$primario" />
      </YStack>

      <YStack flex={1} minW={0} gap={10}>
        <Text fontSize={15} lineHeight={20} color="$texto" numberOfLines={2}>
          {origen}
        </Text>
        <YStack gap={1}>
          <Text fontSize={15} lineHeight={20} color="$texto" fontWeight="600" numberOfLines={2}>
            {destino}
          </Text>
          {destinoDetalle ? (
            <Text fontSize={13} lineHeight={18} color="$textoSecundario" numberOfLines={2}>
              {destinoDetalle}
            </Text>
          ) : null}
        </YStack>
      </YStack>
    </XStack>
  )
}
