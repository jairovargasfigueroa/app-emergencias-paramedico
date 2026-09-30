import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, H1, Input, Label, Paragraph, Spinner, YStack } from 'tamagui'
import { z } from 'zod'

import { mensajeDeError } from '@/shared/api/cliente'
import { olvidarClaveDispositivo } from '@/shared/sesion/queries'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import {
  codigoDeError,
  esquemaPin,
  MENSAJE_TELEFONO_NO_ENCONTRADO,
  mensajePinIncorrecto,
  propsCampoPin,
} from './acceso'
import { ingresarConPinMutation } from './queries'

const esquema = z.object({
  telefono: z.string().trim().min(1, 'Escribe tu teléfono.'),
  pin: esquemaPin,
})

/** Un rechazo del servidor va junto al campo que hay que corregir; si no es de ninguno, sobre el botón. */
type ErrorServidor = { campo: 'telefono' | 'pin' | null; texto: string }

/** Por qué hay que volver a activar el teléfono, dicho como lo diría la central. `null` si el rechazo es otro. */
function motivoParaActivar(error: unknown) {
  switch (codigoDeError(error)) {
    case 'DISPOSITIVO_NO_VINCULADO':
      return 'Tu cuenta se activó en otro teléfono. Para usar este, escribe el código nuevo que te dé la central.'
    case 'PARAMEDICO_SIN_ACTIVAR':
      return 'Tu cuenta todavía no está activada. Escribe el código de activación que te dio la central.'
    default:
      return null
  }
}

function errorDeIngreso(error: unknown): ErrorServidor {
  switch (codigoDeError(error)) {
    case 'NO_ENCONTRADO':
      return { campo: 'telefono', texto: MENSAJE_TELEFONO_NO_ENCONTRADO }
    case 'PIN_INCORRECTO':
      return { campo: 'pin', texto: mensajePinIncorrecto(error) }
    case 'PIN_BLOQUEADO':
      return { campo: 'pin', texto: 'Tu PIN se bloqueó por demasiados intentos. Pídele a la central un código nuevo.' }
    default:
      return { campo: null, texto: mensajeDeError(error) }
  }
}

type Props = {
  claveDispositivo: string
  telefonoInicial: string
  /** Pasa a activar el teléfono con el número que quedó escrito y, si lo hay, el motivo. */
  onActivar: (telefono: string, motivo?: string) => void
}

/**
 * Entrada de todos los días, con el teléfono ya activado: el número, que casi siempre es el de la última vez, y el
 * PIN. Si el servidor dice que este teléfono ya no es el suyo o que la cuenta no está activada, la clave guardada no
 * sirve más: se olvida y se pasa a activar con un código nuevo de la central.
 *
 * Salvo que el número sea otro: entonces es un compañero probando en un teléfono ajeno, y la clave sigue siendo
 * del dueño. Borrarla lo dejaría a él sin poder entrar hasta que la central le dé otro código.
 */
export function FormularioIngreso({ claveDispositivo, telefonoInicial, onActivar }: Props) {
  const queryClient = useQueryClient()
  const ingresar = useMutation(ingresarConPinMutation(queryClient))
  const [errorServidor, setErrorServidor] = useState<ErrorServidor | null>(null)

  const form = useForm({
    defaultValues: { telefono: telefonoInicial, pin: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value, formApi }) => {
      setErrorServidor(null)
      const { telefono, pin } = esquema.parse(value)
      try {
        await ingresar.mutateAsync({ telefono, pin, claveDispositivo })
      } catch (error) {
        const motivo = motivoParaActivar(error)
        if (motivo) {
          if (telefonoInicial.trim() !== '' && telefono !== telefonoInicial.trim()) {
            onActivar(
              telefono,
              'Este teléfono está vinculado a la cuenta de otro paramédico. Para usarlo con la tuya, escribe el código de activación que te dé la central.',
            )
            return
          }
          // Primero el cambio de modo, que lleva el número y el motivo; después se olvida la clave, que ya no sirve.
          onActivar(telefono, motivo)
          await olvidarClaveDispositivo(queryClient)
          return
        }
        const codigo = codigoDeError(error)
        if (codigo === 'PIN_INCORRECTO' || codigo === 'PIN_BLOQUEADO') {
          // Va oculto: no se ve qué dígito estaba mal, así que se escribe entero otra vez.
          formApi.setFieldValue('pin', '')
        }
        setErrorServidor(errorDeIngreso(error))
      }
    },
  })

  const enviar = () => form.handleSubmit().catch(() => {})

  return (
    <>
      <YStack gap={10} mt={40}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          Ingresa tu PIN
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
          Es el que creaste al activar este teléfono.
        </Paragraph>
      </YStack>

      <YStack gap={20} mt={32}>
        <form.Field name="telefono">
          {(field) => {
            const mensaje =
              errorServidor?.campo === 'telefono' ? errorServidor.texto : textoDeErrores(field.state.meta.errors)
            return (
              <YStack gap={8}>
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
                />
                <MensajeDeCampo texto={mensaje} />
              </YStack>
            )
          }}
        </form.Field>

        <form.Field name="pin">
          {(field) => {
            const mensaje = errorServidor?.campo === 'pin' ? errorServidor.texto : textoDeErrores(field.state.meta.errors)
            return (
              <YStack gap={8}>
                <Label htmlFor="pin" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                  PIN
                </Label>
                <Input
                  id="pin"
                  size="$5"
                  height={56}
                  rounded={12}
                  fontSize={18}
                  bg="$superficie"
                  borderColor={mensaje ? '$primario' : '$bordeFuerte'}
                  {...propsCampoPin}
                  value={field.state.value}
                  onChangeText={(texto) => {
                    setErrorServidor(null)
                    field.handleChange(texto)
                  }}
                  onBlur={field.handleBlur}
                  returnKeyType="done"
                  onSubmitEditing={enviar}
                />
                <MensajeDeCampo texto={mensaje} />
              </YStack>
            )
          }}
        </form.Field>
      </YStack>

      <YStack flex={1} minH={32} />

      <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
        {([enviando]) => (
          <YStack gap={12}>
            <MensajeDeCampo texto={errorServidor?.campo === null ? errorServidor.texto : null} />
            <BotonPrincipal
              disabled={enviando}
              opacity={enviando ? 0.7 : 1}
              icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
              onPress={enviar}
            >
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                {ingresar.isPaused ? 'Esperando conexión…' : 'Entrar'}
              </Button.Text>
            </BotonPrincipal>
            {/* Un PIN bloqueado o un teléfono nuevo se resuelven igual: con un código que da la central. */}
            <Button
              height={48}
              rounded={14}
              chromeless
              disabled={enviando}
              onPress={() => onActivar(form.getFieldValue('telefono'))}
            >
              <Button.Text color="$texto" fontSize={15} fontWeight="500">
                Tengo un código nuevo
              </Button.Text>
            </Button>
          </YStack>
        )}
      </form.Subscribe>
    </>
  )
}
