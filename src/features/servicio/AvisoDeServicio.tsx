import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { avisoDeServicioVistoQuery, marcarAvisoDeServicioVistoMutation } from './queries'

type Props = {
  paramedicoId: number
  placa: string
}

/**
 * Se muestra una sola vez, al entrar en servicio: es su teléfono y su batería, y explica por qué le van a llegar
 * emergencias aunque tenga la app cerrada (PB-03 R4).
 */
export function AvisoDeServicio({ paramedicoId, placa }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const queryClient = useQueryClient()
  const visto = useQuery(avisoDeServicioVistoQuery(paramedicoId))
  const marcarVisto = useMutation(marcarAvisoDeServicioVistoMutation(queryClient))

  const abierto = visto.data === false && !marcarVisto.isPending && !marcarVisto.isSuccess

  return (
    <Sheet modal open={abierto} snapPointsMode="fit" dismissOnOverlayPress={false}>
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={18}
        px={20}
        pt={28}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <YStack width={52} height={52} rounded={999} bg="$disponibleTinte" items="center" justify="center">
          <Feather name="plus" size={26} color={tema.disponibleTexto?.val} />
        </YStack>

        <YStack gap={8}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            {`Estás en servicio · ${placa}`}
          </H2>
          <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
            Mientras dure tu turno compartimos la ubicación de tu unidad, también con la app cerrada. Así te llegan
            primero las emergencias más cercanas.
          </Paragraph>
        </YStack>

        <BotonPrincipal onPress={() => marcarVisto.mutate(paramedicoId)}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Entendido
          </Button.Text>
        </BotonPrincipal>
      </Sheet.Frame>
    </Sheet>
  )
}
