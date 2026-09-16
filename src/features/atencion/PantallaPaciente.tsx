import Feather from '@expo/vector-icons/Feather'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Input, Label, Paragraph, Spinner, XStack, YStack, useTheme, useToastController } from 'tamagui'
import { z } from 'zod'

import { paramedicoGuardadoQuery } from '@/features/servicio/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import type { Atencion } from './api'
import { actualizarPacienteMutation, atencionActivaQuery } from './queries'

const esquema = z.object({
  nombrePaciente: z.string().trim().max(255, 'El nombre es demasiado largo.'),
  documentoPaciente: z.string().trim().max(255, 'El documento es demasiado largo.'),
})

function volver() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

/**
 * PB-05 R3 y CA-08: nombre y documento del paciente, opcionales y corregibles mientras la atención esté activa. Va en
 * pantalla completa porque es un formulario con teclado, y nunca bloquea un hito.
 */
export function PantallaPaciente() {
  const paramedico = useQuery(paramedicoGuardadoQuery()).data
  const atencion = useQuery({ ...atencionActivaQuery(paramedico?.id ?? 0), enabled: paramedico != null })

  if (atencion.isPending) {
    return <PantallaDeEstado cargando />
  }

  if (!paramedico || !atencion.data) {
    return (
      <PantallaDeEstado
        titulo="No tienes una atención en curso"
        descripcion="Los datos del paciente se anotan mientras la atención sigue abierta."
      >
        <BotonPrincipal onPress={volver}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Volver
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  return <FormularioPaciente paramedicoId={paramedico.id} atencion={atencion.data} />
}

function FormularioPaciente({ paramedicoId, atencion }: { paramedicoId: number; atencion: Atencion }) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const guardar = useMutation(actualizarPacienteMutation(queryClient))

  const form = useForm({
    defaultValues: {
      nombrePaciente: atencion.nombrePaciente ?? '',
      documentoPaciente: atencion.documentoPaciente ?? '',
    },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const { nombrePaciente, documentoPaciente } = esquema.parse(value)
      try {
        await guardar.mutateAsync({
          paramedicoId,
          atencionId: atencion.id,
          datos: {
            nombrePaciente: nombrePaciente || undefined,
            documentoPaciente: documentoPaciente || undefined,
          },
        })
        volver()
      } catch (error) {
        toast.show('No se pudieron guardar los datos', { message: mensajeDeError(error) })
      }
    },
  })

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <YStack flex={1} bg="$fondo" pt={margenes.top + 12} pb={margenes.bottom + 20}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <XStack items="center" gap={12}>
            <Button
              width={44}
              height={44}
              p={0}
              rounded={999}
              bg="$superficie"
              borderColor="$borde"
              aria-label="Volver"
              onPress={volver}
            >
              <Feather name="chevron-left" size={24} color={tema.texto?.val} />
            </Button>
            <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
              Datos del paciente
            </H1>
          </XStack>

          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            Son opcionales y puedes corregirlos mientras la atención siga activa.
          </Paragraph>

          <form.Field name="nombrePaciente">
            {(field) => (
              <YStack gap={8}>
                <Label htmlFor="nombrePaciente" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                  Nombre
                </Label>
                <Input
                  id="nombrePaciente"
                  size="$5"
                  height={54}
                  rounded={12}
                  fontSize={17}
                  bg="$superficie"
                  borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="Nombre y apellido"
                  placeholderTextColor="$textoTenue"
                  autoCapitalize="words"
                />
                <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          <form.Field name="documentoPaciente">
            {(field) => (
              <YStack gap={8}>
                <Label htmlFor="documentoPaciente" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                  Documento
                </Label>
                <Input
                  id="documentoPaciente"
                  size="$5"
                  height={54}
                  rounded={12}
                  fontSize={17}
                  bg="$superficie"
                  borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="Carnet de identidad"
                  placeholderTextColor="$textoTenue"
                  autoCapitalize="characters"
                />
                <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          <YStack flex={1} minH={24} />
        </ScrollView>

        <YStack px={20} pt={12}>
          <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
            {([enviando]) => (
              <BotonPrincipal
                disabled={enviando}
                opacity={enviando ? 0.7 : 1}
                icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
                onPress={() => form.handleSubmit().catch(() => {})}
              >
                <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                  Guardar
                </Button.Text>
              </BotonPrincipal>
            )}
          </form.Subscribe>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}
