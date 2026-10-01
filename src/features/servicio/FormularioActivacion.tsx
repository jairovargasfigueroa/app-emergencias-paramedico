import Feather from '@expo/vector-icons/Feather'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, H1, Input, Label, Paragraph, Spinner, XStack, YStack, useTheme } from 'tamagui'
import { z } from 'zod'

import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { CajitasDeCodigo } from '@/shared/ui/CajitasDeCodigo'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import {
  codigoDeError,
  esquemaPinNuevo,
  formatearCodigoActivacion,
  intentosRestantes,
  MENSAJE_PIN_DEBIL,
  MENSAJE_TELEFONO_NO_ENCONTRADO,
  textoIntentos,
} from './acceso'
import { activarTelefonoMutation } from './queries'

const esquema = z
  .object({
    telefono: z.string().trim().min(1, 'Escribe tu teléfono.'),
    codigo: z.string().trim().min(1, 'Escribe el código que te dio la central.'),
    pin: esquemaPinNuevo,
    confirmacion: z.string().min(1, 'Vuelve a escribir el PIN.'),
  })
  .refine(({ pin, confirmacion }) => !confirmacion || pin === confirmacion, {
    error: 'Los dos PIN no coinciden.',
    path: ['confirmacion'],
  })

/** Un rechazo del servidor va junto al campo que hay que corregir; si no es de ninguno, sobre el botón. */
type ErrorServidor = { campo: 'telefono' | 'codigo' | 'pin' | null; texto: string }

function errorDeActivacion(error: unknown): ErrorServidor {
  switch (codigoDeError(error)) {
    case 'NO_ENCONTRADO':
      return { campo: 'telefono', texto: MENSAJE_TELEFONO_NO_ENCONTRADO }
    case 'CODIGO_ACTIVACION_INVALIDO': {
      const restantes = intentosRestantes(error)
      // Sin intentos no queda código que probar: no había uno pendiente o se anuló por equivocarse demasiado.
      if (restantes === 0) {
        return { campo: 'codigo', texto: 'Ese código ya no sirve. Pídele a la central un código nuevo.' }
      }
      const texto = restantes === null ? 'El código no es correcto.' : `El código no es correcto. ${textoIntentos(restantes)}`
      return { campo: 'codigo', texto }
    }
    case 'CODIGO_ACTIVACION_VENCIDO':
      return { campo: 'codigo', texto: 'Tu código venció. Pídele a la central un código nuevo.' }
    case 'PIN_DEBIL':
      return { campo: 'pin', texto: MENSAJE_PIN_DEBIL }
    default:
      return { campo: null, texto: mensajeDeError(error) }
  }
}

type Props = {
  telefonoInicial: string
  /** Por qué se pide activar otra vez, si fue el servidor el que lo pidió. */
  aviso: string | null
  /** Vuelve a entrar con el PIN, con el número que quedó escrito. Solo si este teléfono tiene su clave guardada. */
  onIngresarConPin?: (telefono: string) => void
}

/**
 * Primera vez en este teléfono, o un código nuevo después de un PIN bloqueado o de un cambio de teléfono: la central
 * le entrega el código al paramédico en persona, y con él crea el PIN que le va a pedir la app para entrar y para
 * iniciar cada turno. El PIN se revisa acá con las mismas reglas del servidor, para avisarlo antes de enviar.
 */
export function FormularioActivacion({ telefonoInicial, aviso, onIngresarConPin }: Props) {
  const tema = useTheme()
  const queryClient = useQueryClient()
  const activar = useMutation(activarTelefonoMutation(queryClient))
  const [errorServidor, setErrorServidor] = useState<ErrorServidor | null>(null)
  // Arranca oculto: mostrarlo lo decide quien lo escribe, que es el que ve quién tiene al lado.
  const [pinOculto, setPinOculto] = useState(true)

  const form = useForm({
    defaultValues: { telefono: telefonoInicial, codigo: '', pin: '', confirmacion: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      setErrorServidor(null)
      const { telefono, codigo, pin } = esquema.parse(value)
      try {
        await activar.mutateAsync({ telefono, codigo, pin })
      } catch (error) {
        setErrorServidor(errorDeActivacion(error))
      }
    },
  })

  const enviar = () => form.handleSubmit().catch(() => {})

  return (
    <>
      <YStack gap={10} mt={40}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          Activa este teléfono
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
          Con el código que te da la central vinculas este teléfono a tu cuenta y creas tu PIN. Lo vas a usar para entrar
          y para iniciar cada turno.
        </Paragraph>
      </YStack>

      {aviso ? (
        <XStack
          gap={12}
          mt={24}
          px={14}
          py={12}
          rounded={14}
          borderWidth={1}
          borderColor="$enAtencion"
          bg="$enAtencionTinte"
        >
          <Feather name="alert-triangle" size={20} color={tema.enAtencionTexto?.val} />
          <Paragraph flex={1} color="$texto" fontSize={15} lineHeight={22}>
            {aviso}
          </Paragraph>
        </XStack>
      ) : null}

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

        <form.Field name="codigo">
          {(field) => {
            const mensaje =
              errorServidor?.campo === 'codigo' ? errorServidor.texto : textoDeErrores(field.state.meta.errors)
            return (
              <YStack gap={8}>
                <YStack gap={2}>
                  <Label htmlFor="codigo" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                    Código de activación
                  </Label>
                  <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
                    Te lo da la central.
                  </Paragraph>
                </YStack>
                {/*
                  En mono y con la forma en que lo entrega la central: el código se dicta o se copia de un papel, y así
                  cada carácter se distingue bien y se compara de a cuatro.
                */}
                <Input
                  id="codigo"
                  size="$5"
                  height={56}
                  rounded={12}
                  fontSize={18}
                  fontFamily="$mono"
                  bg="$superficie"
                  borderColor={mensaje ? '$primario' : '$bordeFuerte'}
                  value={field.state.value}
                  onChangeText={(texto) => {
                    setErrorServidor(null)
                    field.handleChange(formatearCodigoActivacion(texto))
                  }}
                  onBlur={field.handleBlur}
                  placeholder="XXXX-XXXX"
                  placeholderTextColor="$textoTenue"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
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
                <YStack gap={2}>
                  <XStack items="center" justify="space-between" gap={12}>
                    <Label htmlFor="pin" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                      Crea tu PIN
                    </Label>
                    {/* Uno solo para las dos filas: así se comparan a la vista, sin acordarse de lo escrito. */}
                    <Button
                      height={48}
                      px={12}
                      rounded={14}
                      chromeless
                      icon={<Feather name={pinOculto ? 'eye' : 'eye-off'} size={18} color={tema.texto?.val} />}
                      onPress={() => setPinOculto((oculto) => !oculto)}
                    >
                      <Button.Text color="$texto" fontSize={15} fontWeight="500">
                        {pinOculto ? 'Mostrar PIN' : 'Ocultar PIN'}
                      </Button.Text>
                    </Button>
                  </XStack>
                  <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
                    6 números que no sean todos iguales ni seguidos.
                  </Paragraph>
                </YStack>
                <CajitasDeCodigo
                  id="pin"
                  etiqueta="Crea tu PIN"
                  oculto={pinOculto}
                  error={Boolean(mensaje)}
                  valor={field.state.value}
                  onCambiar={(valor) => {
                    setErrorServidor(null)
                    field.handleChange(valor)
                  }}
                  onBlur={field.handleBlur}
                />
                <MensajeDeCampo texto={mensaje} />
              </YStack>
            )
          }}
        </form.Field>

        <form.Field name="confirmacion">
          {(field) => {
            const mensaje = textoDeErrores(field.state.meta.errors)
            return (
              <YStack gap={8}>
                <Label htmlFor="confirmacion" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                  Repite el PIN
                </Label>
                {/* Al completarla no se activa sola: el PIN se crea una vez y se revisa antes de tocar "Activar". */}
                <CajitasDeCodigo
                  id="confirmacion"
                  etiqueta="Repite el PIN"
                  oculto={pinOculto}
                  error={Boolean(mensaje)}
                  valor={field.state.value}
                  onCambiar={(valor) => {
                    setErrorServidor(null)
                    field.handleChange(valor)
                  }}
                  onBlur={field.handleBlur}
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
                {activar.isPaused ? 'Esperando conexión…' : 'Activar'}
              </Button.Text>
            </BotonPrincipal>
            {onIngresarConPin ? (
              <Button
                height={48}
                rounded={14}
                chromeless
                disabled={enviando}
                onPress={() => onIngresarConPin(form.getFieldValue('telefono'))}
              >
                <Button.Text color="$texto" fontSize={15} fontWeight="500">
                  Ya tengo mi PIN
                </Button.Text>
              </Button>
            ) : null}
          </YStack>
        )}
      </form.Subscribe>
    </>
  )
}
