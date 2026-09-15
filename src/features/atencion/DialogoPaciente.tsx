import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Input, Label, Paragraph, Sheet, Spinner, YStack } from 'tamagui'
import { z } from 'zod'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import type { DatosPaciente } from './api'

const esquema = z.object({
  nombrePaciente: z.string().trim().max(255, 'El nombre es demasiado largo.'),
  documentoPaciente: z.string().trim().max(255, 'El documento es demasiado largo.'),
})

type Props = {
  abierto: boolean
  titulo: string
  descripcion: string
  textoConfirmar: string
  valoresIniciales: { nombrePaciente: string | null; documentoPaciente: string | null }
  /** Debe devolver la promesa de la petición: el formulario queda enviando hasta que termine. */
  onConfirmar: (datos: DatosPaciente) => Promise<unknown>
  onCerrar: () => void
}

/**
 * PB-05 R3: nombre y documento del paciente, opcionales. Se usa al marcar la recogida y para editarlos después.
 * Todo llega por props: el contenido se pinta en un portal.
 */
export function DialogoPaciente({ abierto, titulo, descripcion, textoConfirmar, valoresIniciales, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()

  const form = useForm({
    defaultValues: {
      nombrePaciente: valoresIniciales.nombrePaciente ?? '',
      documentoPaciente: valoresIniciales.documentoPaciente ?? '',
    },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const { nombrePaciente, documentoPaciente } = esquema.parse(value)
      await onConfirmar({
        nombrePaciente: nombrePaciente || undefined,
        documentoPaciente: documentoPaciente || undefined,
      })
    },
  })

  const nombreInicial = valoresIniciales.nombrePaciente ?? ''
  const documentoInicial = valoresIniciales.documentoPaciente ?? ''

  useEffect(() => {
    // Cada vez que se abre, el formulario parte de los datos que ya tiene la atención.
    if (abierto) {
      form.reset({ nombrePaciente: nombreInicial, documentoPaciente: documentoInicial })
    }
  }, [abierto, nombreInicial, documentoInicial, form])

  function cerrar() {
    onCerrar()
  }

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente) {
          cerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      moveOnKeyboardChange
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
            {titulo}
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {descripcion}
          </Paragraph>
        </YStack>

        <form.Field name="nombrePaciente">
          {(field) => (
            <YStack gap={8}>
              <Label htmlFor="nombrePaciente" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                Nombre del paciente
              </Label>
              <Input
                id="nombrePaciente"
                size="$5"
                height={52}
                rounded={12}
                bg="$superficie"
                borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="Opcional"
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
                height={52}
                rounded={12}
                bg="$superficie"
                borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="Opcional"
                autoCapitalize="characters"
              />
              <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
            </YStack>
          )}
        </form.Field>

        <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
          {([enviando]) => (
            <YStack gap={10}>
              <BotonPrincipal
                disabled={enviando}
                opacity={enviando ? 0.7 : 1}
                icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
                onPress={() => form.handleSubmit().catch(() => {})}
              >
                <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                  {textoConfirmar}
                </Button.Text>
              </BotonPrincipal>
              <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={cerrar}>
                <Button.Text color="$texto" fontSize={16} fontWeight="500">
                  Volver
                </Button.Text>
              </Button>
            </YStack>
          )}
        </form.Subscribe>
      </Sheet.Frame>
    </Sheet>
  )
}
