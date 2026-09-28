import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, RadioGroup, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { MotivoSinTraslado } from './api'

type Opcion = { valor: MotivoSinTraslado; titulo: string; detalle: string }

/**
 * Cómo terminó la salida. El motivo no es solo para el registro: decide con qué estado cierra el incidente, por eso
 * se dice debajo de cada opción qué va a pasar.
 */
const MOTIVOS_EMERGENCIA: Opcion[] = [
  { valor: 'ATENDIDO_EN_EL_LUGAR', titulo: 'Lo atendí acá', detalle: 'No hizo falta trasladarlo' },
  { valor: 'PACIENTE_RECHAZO', titulo: 'No quiso ir', detalle: 'El paciente rechaza el traslado' },
  { valor: 'NO_HABIA_PACIENTE', titulo: 'No había nadie', detalle: 'El incidente queda como falsa alarma' },
  { valor: 'TRASLADO_POR_OTRO_MEDIO', titulo: 'Ya se lo llevaron', detalle: 'El incidente queda como atendido por otros' },
  { valor: 'FALLECIDO', titulo: 'Falleció en el lugar', detalle: 'Sin traslado' },
]

/**
 * En un traslado nadie espera que se lo atienda en la puerta: se va a buscar a alguien para llevarlo. Cualquiera de
 * estos motivos deja el traslado como no realizado; debajo se dice qué se encontró.
 */
const MOTIVOS_TRASLADO: Opcion[] = [
  { valor: 'PACIENTE_RECHAZO', titulo: 'No quiso viajar', detalle: 'El paciente rechaza el traslado' },
  { valor: 'NO_HABIA_PACIENTE', titulo: 'No había nadie', detalle: 'Nadie respondió en el origen' },
  { valor: 'TRASLADO_POR_OTRO_MEDIO', titulo: 'Ya se fue por otro medio', detalle: 'Viajó por su cuenta antes de que llegaras' },
  { valor: 'FALLECIDO', titulo: 'Falleció', detalle: 'Sin traslado' },
]

/** Solo después de la espera: primero se avisa que no estaba listo y se le da la tolerancia. */
const NO_ESTABA_LISTO: Opcion = {
  valor: 'PACIENTE_NO_LISTO',
  titulo: 'No estaba listo',
  detalle: 'Pasó la espera y todavía no podía salir',
}

type Props = {
  abierto: boolean
  /** En un traslado se ofrecen sus propios motivos y se dicen con sus palabras. */
  esTraslado: boolean
  /** Solo en traslados: hasta cuándo se espera a un paciente que no estaba listo. Cumplida, se puede cerrar por eso. */
  esperaHasta: string | null
  /** El motivo que ya viene elegido, cuando se abre desde un botón que lo dice. */
  motivoInicial: MotivoSinTraslado | null
  enviando: boolean
  /** El cierre registra dónde terminó la atención: sin ubicación no se puede confirmar. */
  sinPosicion: boolean
  onConfirmar: (motivo: MotivoSinTraslado) => void
  onCerrar: () => void
}

/** No es una cancelación: la unidad fue, resolvió y lo reporta. Por eso tiene sus propios motivos. */
export function DialogoSinTraslado({
  abierto,
  esTraslado,
  esperaHasta,
  motivoInicial,
  enviando,
  sinPosicion,
  onConfirmar,
  onCerrar,
}: Props) {
  const margenes = useSafeAreaInsets()
  const [motivo, setMotivo] = useState<MotivoSinTraslado | null>(null)

  useEffect(() => {
    if (abierto) {
      setMotivo(motivoInicial)
    }
  }, [abierto, motivoInicial])

  // Se mira al abrir. Si la espera se cumple con el diálogo abierto, la opción aparece al volver a abrirlo; para irse
  // apenas se cumple está el botón de la espera, que sí lleva la cuenta.
  const esperaCumplida = esperaHasta !== null && Date.now() >= new Date(esperaHasta).getTime()
  const motivos = esTraslado
    ? esperaCumplida
      ? [NO_ESTABA_LISTO, ...MOTIVOS_TRASLADO]
      : MOTIVOS_TRASLADO
    : MOTIVOS_EMERGENCIA

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !enviando) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!enviando}
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
            Terminé sin trasladar
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {esTraslado
              ? 'Cuenta qué pasó en el origen. El traslado queda como no realizado.'
              : 'Cuenta qué pasó en el lugar. Con esto se cierra el incidente.'}
          </Paragraph>
        </YStack>

        <RadioGroup
          value={motivo ?? ''}
          onValueChange={(valor) => setMotivo(valor as MotivoSinTraslado)}
          gap={8}
          aria-label={esTraslado ? 'Qué pasó en el origen' : 'Qué pasó en el lugar'}
        >
          {motivos.map(({ valor, titulo, detalle }) => {
            const elegido = motivo === valor
            const id = `sin-traslado-${valor}`
            return (
              <XStack
                key={valor}
                items="center"
                gap={12}
                minH={52}
                px={14}
                py={12}
                rounded={14}
                borderWidth={elegido ? 2 : 1}
                borderColor={elegido ? '$primario' : '$borde'}
                onPress={() => setMotivo(valor)}
              >
                <RadioGroup.Item value={valor} id={id} size="$4" borderColor={elegido ? '$primario' : '$bordeFuerte'}>
                  <RadioGroup.Indicator bg="$primario" />
                </RadioGroup.Item>
                <YStack flex={1} gap={2}>
                  <Label htmlFor={id} color="$texto" fontSize={15} lineHeight={20} fontWeight={elegido ? '600' : '500'}>
                    {titulo}
                  </Label>
                  <Text color="$textoSecundario" fontSize={13}>
                    {detalle}
                  </Text>
                </YStack>
              </XStack>
            )
          })}
        </RadioGroup>

        <YStack gap={10}>
          {/* Como en los hitos: sin ubicación el botón queda apagado y se dice por qué, en vez de no hacer nada. */}
          {sinPosicion ? (
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
              Esperando tu ubicación para poder terminar la atención
            </Paragraph>
          ) : null}
          <BotonPrincipal
            disabled={!motivo || enviando || sinPosicion}
            opacity={!motivo || enviando || sinPosicion ? 0.6 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={() => motivo && onConfirmar(motivo)}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Terminar la atención
            </Button.Text>
          </BotonPrincipal>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
