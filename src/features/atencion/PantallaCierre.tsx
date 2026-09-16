import Feather from '@expo/vector-icons/Feather'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack } from 'tamagui'

import { horaCorta } from '@/shared/formato/tiempo'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

type Tiempos = {
  llegada: string
  recogida: string
  entrega: string
}

/**
 * PB-05 CA-03: el servicio terminó. Los tres tiempos vienen en la respuesta de la entrega; un cierre así merece la
 * pantalla entera, porque lo de atrás ya no importa.
 */
export function PantallaCierre() {
  const margenes = useSafeAreaInsets()
  const tiempos = useLocalSearchParams<Tiempos>()

  return (
    <YStack
      flex={1}
      bg="$superficie"
      items="center"
      justify="center"
      gap={18}
      px={24}
      pt={margenes.top + 24}
      pb={margenes.bottom + 24}
    >
      <YStack width={64} height={64} rounded={999} bg="$disponible" items="center" justify="center">
        <Feather name="check" size={32} color="#FFFFFF" />
      </YStack>

      <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600" text="center">
        Servicio terminado
      </H1>

      <YStack self="stretch" gap={10} py={16} borderTopWidth={1} borderBottomWidth={1} borderColor="$borde">
        <Tiempo etiqueta="Llegada" hora={tiempos.llegada} />
        <Tiempo etiqueta="Paciente a bordo" hora={tiempos.recogida} />
        <Tiempo etiqueta="Entrega" hora={tiempos.entrega} />
      </YStack>

      <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center">
        Tu unidad vuelve a estar disponible.
      </Paragraph>

      <BotonPrincipal self="stretch" onPress={() => router.dismissTo('/')}>
        <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
          Volver al mapa
        </Button.Text>
      </BotonPrincipal>
    </YStack>
  )
}

function Tiempo({ etiqueta, hora }: { etiqueta: string; hora: string | undefined }) {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <Text color="$textoSecundario" fontSize={15}>
        {etiqueta}
      </Text>
      <Text color="$texto" fontFamily="$mono" fontSize={15} fontWeight="500">
        {hora ? horaCorta(hora) : '—'}
      </Text>
    </XStack>
  )
}
