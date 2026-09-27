import { useQuery } from '@tanstack/react-query'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

import { misTrasladosQuery } from './queries'
import { TarjetaDeTraslado } from './TarjetaDeTraslado'

/** Los traslados que hizo este paramédico. Es para mirar: lo que está haciendo ahora vive en Inicio. */
export function PantallaMisTraslados() {
  const margenes = useSafeAreaInsets()
  const traslados = useQuery(misTrasladosQuery())

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
    >
      <YStack gap={18}>
        <YStack gap={4}>
          <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
            Mis traslados
          </H1>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Los que hiciste, del más reciente al más viejo.
          </Paragraph>
        </YStack>

        {traslados.isPending ? (
          <XStack items="center" gap={8} py={12}>
            <Spinner size="small" color="$textoSecundario" />
            <Text fontSize={14} color="$textoSecundario">
              Cargando…
            </Text>
          </XStack>
        ) : traslados.isError ? (
          <Text fontSize={14} color="$textoSecundario">
            No pudimos cargar tus traslados.
          </Text>
        ) : traslados.data.length === 0 ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Todavía no hiciste ningún traslado.
          </Paragraph>
        ) : (
          <YStack gap={10}>
            {traslados.data.map((atencion) => (
              <TarjetaDeTraslado key={atencion.id} atencion={atencion} />
            ))}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
