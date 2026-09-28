import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

type Props = {
  abierto: boolean
  enviando: boolean
  onConfirmar: () => void
  onCerrar: () => void
}

/**
 * Devolver no es cancelar: la central le asignó el traslado a la unidad y la tripulación dice que no puede hacerlo.
 * El traslado vuelve a la cola y se le busca otra. Es de antes de llegar: en la puerta, el traslado se hace o se
 * cierra sin viaje.
 */
export function DialogoDevolverTraslado({ abierto, enviando, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !enviando) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!enviando}
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
        <YStack gap={6}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            ¿Devolver el traslado?
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            Vuelve a la cola y se le busca otra unidad. Hazlo si no vas a poder ir a buscar al paciente.
          </Paragraph>
        </YStack>

        <YStack gap={10}>
          <BotonPrincipal
            disabled={enviando}
            opacity={enviando ? 0.6 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={onConfirmar}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Devolver el traslado
            </Button.Text>
          </BotonPrincipal>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
