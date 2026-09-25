import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useToastController } from 'tamagui'

import { mensajeDeError } from '@/shared/api/cliente'
import { Insignia } from '@/shared/ui/Insignia'

import { olvidarParamedico, paramedicoGuardadoQuery, servicioActualQuery, terminarTurnoMutation } from './queries'

/**
 * Quién es, con qué unidad trabaja y si está en turno. Terminar el turno y cerrar sesión son dos acciones
 * distintas y se ven separadas: salir de la app no debería dejar a la unidad contada como disponible.
 */
export function PantallaPerfil() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const guardado = useQuery(paramedicoGuardadoQuery()).data
  const servicio = useQuery({ ...servicioActualQuery(guardado?.id ?? 0), enabled: guardado != null })
  const terminar = useMutation(terminarTurnoMutation(queryClient))

  const datos = servicio.data

  function terminarTurno() {
    if (!guardado) {
      return
    }
    terminar.mutate(undefined, {
      onSuccess: () => toast.show('Turno terminado'),
      // El backend rechaza salir con una atención en curso: el motivo se muestra tal cual lo manda.
      onError: (error) => toast.show('No pudiste salir de turno', { message: mensajeDeError(error) }),
    })
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
    >
      <YStack gap={20}>
        <YStack gap={4}>
          <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
            Mi perfil
          </H1>
          {guardado ? (
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              {guardado.nombreCompleto}
              {datos?.paramedico.telefono ? ` · ${datos.paramedico.telefono}` : ''}
            </Paragraph>
          ) : null}
        </YStack>

        <YStack gap={10} p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
          <XStack items="center" justify="space-between" gap={8}>
            <Text fontSize={16} fontWeight="600" color="$texto">
              {datos?.ambulancia?.placa ?? 'Sin unidad asignada'}
            </Text>
            <Insignia tono={datos?.turno ? 'verde' : 'gris'}>{datos?.turno ? 'En turno' : 'Sin turno'}</Insignia>
          </XStack>
          {datos?.turno ? (
            <Text fontSize={13} color="$textoSecundario">
              Desde las{' '}
              {new Date(datos.turno.inicio).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : (
            <Text fontSize={13} lineHeight={18} color="$textoSecundario">
              Mientras no estés en turno, tu unidad no cuenta como disponible y tu teléfono no comparte dónde estás.
            </Text>
          )}
        </YStack>

        {datos?.turno ? (
          <Button
            height={52}
            rounded={14}
            variant="outlined"
            disabled={terminar.isPending}
            opacity={terminar.isPending ? 0.6 : 1}
            onPress={terminarTurno}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="600">
              Terminar turno
            </Button.Text>
          </Button>
        ) : null}

        <Button height={52} rounded={14} chromeless onPress={() => void olvidarParamedico(queryClient)}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Cerrar sesión
          </Button.Text>
        </Button>
      </YStack>
    </ScrollView>
  )
}
