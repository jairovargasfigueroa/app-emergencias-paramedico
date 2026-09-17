import Feather from '@expo/vector-icons/Feather'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Text, XStack, YStack, useTheme } from 'tamagui'

type Props = {
  abierto: boolean
  onCancelarAtencion: () => void
  onCerrar: () => void
}

/**
 * Lo que no es el paso siguiente. Cancelar vive acá y no pegado al botón principal: una atención cancelada queda
 * cerrada para siempre (PB-05 R6).
 */
export function MenuAtencion({ abierto, onCancelarAtencion, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={18}
        px={20}
        pt={24}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <H2 color="$texto" fontSize={22} lineHeight={28} fontWeight="600">
          Más opciones
        </H2>

        <XStack
          role="button"
          aria-label="Cancelar atención"
          items="center"
          gap={12}
          px={14}
          py={12}
          rounded={14}
          borderWidth={1}
          borderColor="$borde"
          pressStyle={{ opacity: 0.8 }}
          onPress={onCancelarAtencion}
        >
          <YStack width={40} height={40} shrink={0} rounded={999} bg="$primarioTinte" items="center" justify="center">
            <Feather name="x-octagon" size={18} color={tema.primarioPresionado?.val} />
          </YStack>
          <YStack flex={1} gap={2}>
            <Text color="$texto" fontSize={16} fontWeight="600">
              Cancelar atención
            </Text>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={19}>
              Queda cerrada para siempre. Si vuelves a tomar la emergencia, se abre una atención nueva.
            </Paragraph>
          </YStack>
        </XStack>

        <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={onCerrar}>
          <Button.Text color="$texto" fontSize={16} fontWeight="500">
            Volver
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}
