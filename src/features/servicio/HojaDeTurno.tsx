import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'

import { activarUbicacion, avisoDeUbicacion, useEstadoUbicacion } from '@/features/posicion/estadoUbicacion'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { Insignia } from '@/shared/ui/Insignia'

import { horaCorta } from '@/shared/formato/tiempo'

import { olvidarParamedico, terminarTurnoMutation } from './queries'

type Props = {
  abierta: boolean
  placa: string
  /** Desde cuándo está en turno, en ISO-8601. */
  inicio: string
  onCerrar: () => void
}

/**
 * El turno: qué unidad es, desde cuándo está adentro y cómo salir. Terminar el turno y cerrar sesión son dos cosas
 * distintas: lo primero se hace todos los días, lo segundo casi nunca, así que no comparten botón.
 */
export function HojaDeTurno({ abierta, placa, inicio, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const aviso = avisoDeUbicacion(useEstadoUbicacion())
  const terminar = useMutation(terminarTurnoMutation(queryClient))

  /** El backend rechaza salir con una atención en curso: el motivo se muestra tal cual lo manda. */
  function terminarTurno() {
    terminar.mutate(undefined, {
      onSuccess: () => onCerrar(),
      onError: (error: unknown) => toast.show('No pudiste salir de turno', { message: mensajeDeError(error) }),
    })
  }

  /** Salir de la app deja de ser trabajar: si hay turno abierto, se cierra primero. */
  function cerrarSesion() {
    terminar.mutate(undefined, {
      onSuccess: () => {
        onCerrar()
        void olvidarParamedico(queryClient)
      },
      onError: (error: unknown) => toast.show('No pudiste cerrar sesión', { message: mensajeDeError(error) }),
    })
  }

  return (
    <Sheet
      modal
      open={abierta}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !terminar.isPending) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!terminar.isPending}
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
        <YStack gap={4}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            Tu turno
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {`Entraste a las ${horaCorta(inicio)}`}
          </Paragraph>
        </YStack>

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
          Al salir dejás de compartir tu ubicación y tu unidad queda sin turno, así que nadie va a contar con ella
          hasta que entre alguien.
        </Paragraph>

        <YStack gap={10}>
          <BotonPrincipal
            disabled={terminar.isPending}
            opacity={terminar.isPending ? 0.6 : 1}
            icon={terminar.isPending ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={terminarTurno}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Terminar turno
            </Button.Text>
          </BotonPrincipal>
          <Button
            height={52}
            rounded={14}
            bg="$superficie"
            borderColor="$bordeFuerte"
            disabled={terminar.isPending}
            onPress={onCerrar}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
          {/* Cerrar sesión es la excepción —otro paramédico en este teléfono—, así que va abajo y sin peso. */}
          <Button height={48} rounded={14} chromeless disabled={terminar.isPending} onPress={cerrarSesion}>
            <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
              Cerrar sesión
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
