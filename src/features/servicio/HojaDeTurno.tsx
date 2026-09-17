import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Text, XStack, YStack } from 'tamagui'

import { activarUbicacion, avisoDeUbicacion, useEstadoUbicacion } from '@/features/posicion/estadoUbicacion'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { Insignia } from '@/shared/ui/Insignia'

import { olvidarParamedico } from './queries'

type Props = {
  abierta: boolean
  placa: string
  onCerrar: () => void
}

/**
 * El turno: qué unidad es, si se está compartiendo la ubicación y cómo terminarlo. Terminar el turno olvida al
 * paramédico, lo que además detiene el envío de posición (PB-03 R4).
 */
export function HojaDeTurno({ abierta, placa, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const aviso = avisoDeUbicacion(useEstadoUbicacion())

  return (
    <Sheet
      modal
      open={abierta}
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
        <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
          Tu turno
        </H2>

        <XStack items="center" justify="space-between" gap={12} px={14} py={12} rounded={12} borderWidth={1} borderColor="$borde">
          <Text color="$texto" fontFamily="$mono" fontSize={16} fontWeight="500">
            {placa}
          </Text>
          {aviso ? (
            <Insignia tono="ambar">Ubicación no disponible</Insignia>
          ) : (
            <Insignia tono="verde" conPunto>
              Compartiendo ubicación
            </Insignia>
          )}
        </XStack>

        {aviso ? (
          <YStack gap={10}>
            <Paragraph color="$enAtencionTexto" fontSize={15} lineHeight={22}>
              {aviso.texto}
            </Paragraph>
            {aviso.conAccion ? (
              <Button height={48} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={activarUbicacion}>
                <Button.Text color="$texto" fontSize={16} fontWeight="500">
                  Activar la ubicación
                </Button.Text>
              </Button>
            ) : null}
          </YStack>
        ) : null}

        <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
          Vas a dejar de compartir tu ubicación. Tu unidad va a seguir figurando como disponible hasta que el
          administrador la marque fuera de servicio: avísale.
        </Paragraph>

        <YStack gap={10}>
          <BotonPrincipal onPress={() => olvidarParamedico(queryClient)}>
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Terminar turno
            </Button.Text>
          </BotonPrincipal>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
