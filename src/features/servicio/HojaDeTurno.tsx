import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'

import { activarUbicacion, avisoDeUbicacion, useEstadoUbicacion } from '@/features/posicion/estadoUbicacion'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { Insignia } from '@/shared/ui/Insignia'

import { horaCorta } from '@/shared/formato/tiempo'

import { cerrarSesionMutation, terminarTurnoMutation } from './queries'

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
  const salir = useMutation(cerrarSesionMutation(queryClient))
  const ocupado = terminar.isPending || salir.isPending

  /**
   * El backend rechaza salir con una atención en curso: el motivo se muestra tal cual lo manda. Con la promesa y no con
   * los callbacks de mutate: sin turno, el mapa y esta hoja desaparecen, y TanStack Query no llama esos callbacks si el
   * componente ya no está.
   */
  function terminarTurno() {
    terminar
      .mutateAsync()
      .then((turno) => {
        if (turno === null) {
          toast.show('Tu turno ya estaba cerrado', { message: 'Lo cerró la central.' })
        }
        onCerrar()
      })
      .catch((error: unknown) => toast.show('No pudiste salir de turno', { message: mensajeDeError(error) }))
  }

  /**
   * Salir de la app deja de ser trabajar: el turno se termina primero, igual que desde el perfil. Al salir, la hoja
   * desaparece con todo lo de adentro. Con la promesa, igual que al terminar el turno: la hoja puede desaparecer antes
   * de que termine, y TanStack Query no llama los callbacks de mutate si el componente ya no está.
   */
  function cerrarSesion() {
    salir
      .mutateAsync(true)
      .catch((error: unknown) => toast.show('No pudiste cerrar sesión', { message: mensajeDeError(error) }))
  }

  return (
    <Sheet
      modal
      open={abierta}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !ocupado) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!ocupado}
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
          Al salir dejas de compartir tu ubicación y tu unidad queda sin turno, así que nadie va a contar con ella
          hasta que entre alguien.
        </Paragraph>

        <YStack gap={10}>
          <BotonPrincipal
            disabled={ocupado}
            opacity={ocupado ? 0.6 : 1}
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
            disabled={ocupado}
            onPress={onCerrar}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
          {/* Cerrar sesión es la excepción —otro paramédico en este teléfono—, así que va abajo y sin peso. */}
          <Button
            height={48}
            rounded={14}
            chromeless
            disabled={ocupado}
            icon={salir.isPending ? <Spinner color="$textoSecundario" /> : undefined}
            onPress={cerrarSesion}
          >
            <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
              Cerrar sesión
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
