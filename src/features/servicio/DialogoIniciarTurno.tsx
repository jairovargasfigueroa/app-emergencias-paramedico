import Feather from '@expo/vector-icons/Feather'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, Sheet, Spinner, YStack, useTheme, type TamaguiElement } from 'tamagui'
import { z } from 'zod'

import { mensajeDeError } from '@/shared/api/cliente'
import { dispositivoQuery } from '@/shared/sesion/queries'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { CajitasDeCodigo } from '@/shared/ui/CajitasDeCodigo'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { codigoDeError, esquemaPin, mensajePinIncorrecto } from './acceso'
import { activarDeNuevo, iniciarTurnoMutation } from './queries'

const esquema = z.object({ pin: esquemaPin })

/** Por qué no se le puede pedir el PIN. Todas se resuelven igual: activando el teléfono con un código de la central. */
type Bloqueo = 'SIN_CLAVE' | 'PIN_BLOQUEADO' | 'DISPOSITIVO_NO_VINCULADO' | 'PARAMEDICO_SIN_ACTIVAR'

const EXPLICACIONES: Record<Bloqueo, { titulo: string; texto: string }> = {
  SIN_CLAVE: {
    titulo: 'Activa este teléfono',
    texto: 'Ahora cada turno empieza con tu PIN. Para crearlo, activa este teléfono con el código que te da la central.',
  },
  PIN_BLOQUEADO: {
    titulo: 'Tu PIN está bloqueado',
    texto:
      'Te equivocaste demasiadas veces. Pídele a la central un código nuevo y activa este teléfono otra vez para crear otro PIN.',
  },
  DISPOSITIVO_NO_VINCULADO: {
    titulo: 'Este teléfono ya no está vinculado',
    texto: 'Tu cuenta se activó en otro teléfono. Para seguir usando este, pídele a la central un código nuevo y actívalo.',
  },
  PARAMEDICO_SIN_ACTIVAR: {
    titulo: 'Tu cuenta no está activada',
    texto: 'Pídele a la central un código de activación y activa este teléfono.',
  },
}

function bloqueoDe(error: unknown): Bloqueo | null {
  const codigo = codigoDeError(error)
  return codigo === 'PIN_BLOQUEADO' || codigo === 'DISPOSITIVO_NO_VINCULADO' || codigo === 'PARAMEDICO_SIN_ACTIVAR'
    ? codigo
    : null
}

type Props = {
  abierto: boolean
  placa: string
  onCerrar: () => void
}

/**
 * Entrar de turno pide el PIN, como quien ficha al llegar a la base: desde ese momento la unidad cuenta como disponible
 * y la central le manda emergencias, así que tiene que ser él quien tiene el teléfono en la mano. Si no se le puede
 * pedir —el teléfono no tiene clave, el PIN se bloqueó o la cuenta se activó en otro teléfono—, explica por qué y
 * ofrece activarlo con un código de la central, que es lo único que lo resuelve: eso cierra la sesión.
 */
export function DialogoIniciarTurno({ abierto, placa, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const queryClient = useQueryClient()
  const claveDispositivo = useQuery(dispositivoQuery()).data?.claveDispositivo ?? null
  const iniciar = useMutation(iniciarTurnoMutation(queryClient))
  const [bloqueo, setBloqueo] = useState<Bloqueo | null>(null)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [activando, setActivando] = useState(false)
  const campoPin = useRef<TamaguiElement>(null)

  const form = useForm({
    defaultValues: { pin: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value, formApi }) => {
      if (!claveDispositivo) {
        return
      }
      setErrorServidor(null)
      try {
        await iniciar.mutateAsync({ pin: esquema.parse(value).pin, claveDispositivo })
        // Con el turno abierto, esta pantalla da paso al mapa y el diálogo desaparece con ella. Igual queda cerrado:
        // si no, al terminar el turno volvería a aparecer abierto.
        formApi.reset()
        onCerrar()
      } catch (error) {
        const bloqueoNuevo = bloqueoDe(error)
        if (bloqueoNuevo) {
          setBloqueo(bloqueoNuevo)
          return
        }
        if (codigoDeError(error) === 'PIN_INCORRECTO') {
          // Va oculto: no se ve qué dígito estaba mal, así que se escribe entero otra vez.
          formApi.setFieldValue('pin', '')
          setErrorServidor(mensajePinIncorrecto(error))
          return
        }
        setErrorServidor(mensajeDeError(error))
      }
    },
  })

  const enviar = () => form.handleSubmit().catch(() => {})
  const ocupado = iniciar.isPending || activando

  /** Con el sexto número entra de turno solo: con guantes, es un toque menos. Si ya salió un intento, no sale otro. */
  function enviarAlCompletar() {
    if (!form.state.isSubmitting) {
      enviar()
    }
  }

  function cerrar() {
    if (ocupado) {
      return
    }
    form.reset()
    setErrorServidor(null)
    onCerrar()
  }

  function activarTelefono() {
    setActivando(true)
    // Cierra la sesión: al terminar, la app ya está en la pantalla de entrada, lista para el código.
    void activarDeNuevo(queryClient)
  }

  // Un bloqueo que ya dijo el servidor sigue valiendo si vuelve a abrir el diálogo: hasta activar, el PIN no sirve.
  const motivo = bloqueo ?? (claveDispositivo ? null : 'SIN_CLAVE')
  const explicacion = motivo ? EXPLICACIONES[motivo] : null

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
      dismissOnOverlayPress={!ocupado}
      moveOnKeyboardChange
      onAnimationComplete={({ open }) => {
        // Con guantes, un toque menos: el teclado aparece solo cuando la hoja terminó de subir.
        if (open && !explicacion) {
          campoPin.current?.focus()
        }
      }}
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
        {explicacion ? (
          <>
            <YStack width={52} height={52} rounded={999} bg="$enAtencionTinte" items="center" justify="center">
              <Feather name="lock" size={24} color={tema.enAtencionTexto?.val} />
            </YStack>

            <YStack gap={8}>
              <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
                {explicacion.titulo}
              </H2>
              <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
                {explicacion.texto}
              </Paragraph>
              <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
                Al activarlo se cierra tu sesión y entras con el código.
              </Paragraph>
            </YStack>

            <YStack gap={10}>
              <BotonPrincipal
                disabled={activando}
                opacity={activando ? 0.7 : 1}
                icon={activando ? <Spinner color="$primarioTexto" /> : undefined}
                onPress={activarTelefono}
              >
                <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                  Activar este teléfono
                </Button.Text>
              </BotonPrincipal>
              <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={activando} onPress={cerrar}>
                <Button.Text color="$texto" fontSize={16} fontWeight="500">
                  Volver
                </Button.Text>
              </Button>
            </YStack>
          </>
        ) : (
          <>
            <YStack gap={6}>
              <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
                Iniciar turno
              </H2>
              <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
                {`Escribe tu PIN para entrar de turno con la unidad ${placa}.`}
              </Paragraph>
            </YStack>

            <form.Field name="pin">
              {(field) => {
                const mensaje = errorServidor ?? textoDeErrores(field.state.meta.errors)
                return (
                  <YStack gap={8}>
                    <Label htmlFor="pin-turno" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                      PIN
                    </Label>
                    <CajitasDeCodigo
                      ref={campoPin}
                      id="pin-turno"
                      etiqueta="PIN"
                      oculto
                      fondo="$fondo"
                      error={Boolean(mensaje)}
                      valor={field.state.value}
                      onCambiar={(valor) => {
                        setErrorServidor(null)
                        field.handleChange(valor)
                      }}
                      onCompletar={enviarAlCompletar}
                      onBlur={field.handleBlur}
                    />
                    <MensajeDeCampo texto={mensaje} />
                  </YStack>
                )
              }}
            </form.Field>

            <YStack gap={10}>
              <BotonPrincipal
                disabled={iniciar.isPending}
                opacity={iniciar.isPending ? 0.7 : 1}
                icon={iniciar.isPending ? <Spinner color="$primarioTexto" /> : undefined}
                onPress={enviar}
              >
                <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                  {iniciar.isPaused ? 'Esperando conexión…' : 'Iniciar turno'}
                </Button.Text>
              </BotonPrincipal>
              <Button
                height={52}
                rounded={14}
                bg="$superficie"
                borderColor="$bordeFuerte"
                disabled={iniciar.isPending}
                onPress={cerrar}
              >
                <Button.Text color="$texto" fontSize={16} fontWeight="500">
                  Volver
                </Button.Text>
              </Button>
            </YStack>
          </>
        )}
      </Sheet.Frame>
    </Sheet>
  )
}
