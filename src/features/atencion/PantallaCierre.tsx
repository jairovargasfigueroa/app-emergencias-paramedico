import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'

import { paramedicoGuardadoQuery } from '@/features/servicio/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { horaCorta } from '@/shared/formato/tiempo'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { atencionActivaQuery, liberarMutation } from './queries'

type Tiempos = {
  llegada: string
  recogida: string
  hospital: string
  entrega: string
}

/**
 * PB-05 CA-03: el paciente quedó entregado. Pero la unidad todavía no está libre: entre dejarlo en el hospital y
 * poder salir a otra emergencia pasan la entrega al médico, el papeleo y la limpieza. Por eso el cierre no es
 * automático, se declara acá.
 */
export function PantallaCierre() {
  const margenes = useSafeAreaInsets()
  const tiempos = useLocalSearchParams<Tiempos>()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const paramedico = useQuery(paramedicoGuardadoQuery()).data
  const atencion = useQuery({ ...atencionActivaQuery(paramedico?.id ?? 0), enabled: paramedico != null }).data
  const liberacion = useMutation(liberarMutation(queryClient))

  function liberar() {
    // Si ya no hay atención ocupando la unidad, alguien la liberó antes: no hay nada que hacer más que volver.
    if (!paramedico || !atencion) {
      router.dismissTo('/')
      return
    }
    liberacion.mutate(
      { paramedicoId: paramedico.id, atencionId: atencion.id },
      {
        onSuccess: () => router.dismissTo('/'),
        onError: (error: unknown) =>
          toast.show('No se pudo liberar la unidad', { message: mensajeDeError(error) }),
      },
    )
  }

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
        Paciente entregado
      </H1>

      <YStack self="stretch" gap={10} py={16} borderTopWidth={1} borderBottomWidth={1} borderColor="$borde">
        <Tiempo etiqueta="Llegada" hora={tiempos.llegada} />
        <Tiempo etiqueta="Paciente a bordo" hora={tiempos.recogida} />
        <Tiempo etiqueta="Llegada al hospital" hora={tiempos.hospital} />
        <Tiempo etiqueta="Entrega" hora={tiempos.entrega} />
      </YStack>

      <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center">
        Tu unidad sigue ocupada. Liberala cuando estés listo para otra emergencia.
      </Paragraph>

      <BotonPrincipal
        self="stretch"
        disabled={liberacion.isPending}
        opacity={liberacion.isPending ? 0.6 : 1}
        icon={liberacion.isPending ? <Spinner color="$primarioTexto" /> : undefined}
        onPress={liberar}
      >
        <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
          Ya estoy disponible
        </Button.Text>
      </BotonPrincipal>

      {/* Todavía con papeleo o limpieza: se vuelve al mapa y la unidad se libera desde ahí. */}
      <Button self="stretch" height={48} rounded={14} chromeless onPress={() => router.dismissTo('/')}>
        <Button.Text color="$texto" fontSize={15} fontWeight="500">
          Ahora no
        </Button.Text>
      </Button>
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
