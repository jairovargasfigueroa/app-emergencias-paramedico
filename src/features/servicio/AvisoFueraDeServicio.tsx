import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { mensajeDeError } from '@/shared/api/cliente'

import { reactivarAmbulanciaMutation } from './queries'

/** PB-05 R11 y CA-19: tras una avería, el paramédico reactiva la ambulancia cuando está reparada. */
export function AvisoFueraDeServicio({ ambulanciaId }: { ambulanciaId: number }) {
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const reactivar = useMutation(reactivarAmbulanciaMutation(queryClient))

  return (
    <XStack items="center" gap={12} p={14} rounded={16} bg="$superficie" borderWidth={1} borderColor="$borde">
      <YStack width={40} height={40} shrink={0} rounded={999} bg="$fueraServicioTinte" items="center" justify="center">
        <Feather name="tool" size={18} color={tema.fueraServicioTexto?.val} />
      </YStack>
      <YStack flex={1} gap={2}>
        <Text color="$texto" fontSize={15} fontWeight="600">
          Ambulancia fuera de servicio
        </Text>
        <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
          Reactívala cuando esté reparada para volver a acudir.
        </Paragraph>
      </YStack>
      <Button
        size="$3"
        height={48}
        rounded={10}
        bg="$primario"
        borderWidth={0}
        pressStyle={{ bg: '$primarioPresionado' }}
        disabled={reactivar.isPending}
        icon={reactivar.isPending ? <Spinner size="small" color="$primarioTexto" /> : undefined}
        // Con la promesa y no con los callbacks de mutate: al quedar en servicio esta tarjeta desaparece, y TanStack Query
        // no llama esos callbacks si el componente ya no está.
        onPress={() =>
          reactivar
            .mutateAsync(ambulanciaId)
            .then((ambulancia) =>
              ambulancia
                ? toast.show('Ambulancia disponible', { message: 'Ya puedes tomar incidentes.' })
                : toast.show('Tu ambulancia ya estaba en servicio', {
                    message: 'La reactivó la central o tu compañero de turno.',
                  }),
            )
            .catch((error: unknown) => toast.show('No se pudo reactivar', { message: mensajeDeError(error) }))
        }
      >
        <Button.Text color="$primarioTexto" fontSize={14} fontWeight="600">
          Reactivar
        </Button.Text>
      </Button>
    </XStack>
  )
}
