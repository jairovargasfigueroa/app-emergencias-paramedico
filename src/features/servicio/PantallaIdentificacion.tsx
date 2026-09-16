import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Input, Label, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { z } from 'zod'

import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MarcaSga } from '@/shared/ui/MarcaSga'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { identificarMutation } from './queries'

const esquema = z.object({
  telefono: z.string().trim().min(1, 'Escribe tu teléfono.'),
})

/** 404: no hay un paramédico activo con ese teléfono. El mensaje dice qué hacer, no solo que no se encontró. */
function mensajeDeIdentificacion(error: unknown) {
  if (error instanceof ErrorApi && error.status === 404) {
    return 'No encontramos ese teléfono. Pídele al administrador que verifique con qué número te registró.'
  }
  return mensajeDeError(error)
}

/** Identificación provisional por teléfono, mientras no exista autenticación. */
export function PantallaIdentificacion() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const identificar = useMutation(identificarMutation(queryClient))
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { telefono: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      setErrorServidor(null)
      try {
        await identificar.mutateAsync(esquema.parse(value).telefono)
      } catch (error) {
        setErrorServidor(mensajeDeIdentificacion(error))
      }
    },
  })

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 40} pb={margenes.bottom + 24}>
          <XStack items="center" gap={12}>
            <MarcaSga tamano={44} />
            <Text color="$textoSecundario" fontSize={15} fontWeight="500">
              SGA · Paramédicos
            </Text>
          </XStack>

          <YStack gap={10} mt={40}>
            <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
              ¿Quién está de turno?
            </H1>
            <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
              Escribe el teléfono con el que te registró el administrador.
            </Paragraph>
          </YStack>

          <form.Field name="telefono">
            {(field) => {
              const mensaje = errorServidor ?? textoDeErrores(field.state.meta.errors)
              return (
                <YStack gap={8} mt={36}>
                  <Label htmlFor="telefono" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    size="$5"
                    height={56}
                    rounded={12}
                    fontSize={18}
                    bg="$superficie"
                    borderColor={mensaje ? '$primario' : '$bordeFuerte'}
                    value={field.state.value}
                    onChangeText={(texto) => {
                      setErrorServidor(null)
                      field.handleChange(texto)
                    }}
                    onBlur={field.handleBlur}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    returnKeyType="done"
                    onSubmitEditing={() => form.handleSubmit().catch(() => {})}
                  />
                  <MensajeDeCampo texto={mensaje} />
                </YStack>
              )
            }}
          </form.Field>

          <YStack flex={1} minH={32} />

          <YStack gap={12}>
            <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
              {([enviando]) => (
                <BotonPrincipal
                  disabled={enviando}
                  opacity={enviando ? 0.7 : 1}
                  icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
                  onPress={() => form.handleSubmit().catch(() => {})}
                >
                  <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                    {identificar.isPaused ? 'Esperando conexión…' : 'Entrar'}
                  </Button.Text>
                </BotonPrincipal>
              )}
            </form.Subscribe>
            {/* Lo que pasa al entrar, antes de tocar: queda en servicio y su unidad empieza a figurar en el mapa. */}
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
              Al entrar quedas en servicio: tu unidad aparece en el mapa y empiezas a recibir emergencias.
            </Paragraph>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
