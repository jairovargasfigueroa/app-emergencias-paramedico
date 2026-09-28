import Feather from '@expo/vector-icons/Feather'
import { useEffect, useState } from 'react'
import { Button, H2, Paragraph, Sheet, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { Movilidad } from './api'

const MOVILIDADES: { valor: Movilidad; titulo: string; detalle: string }[] = [
  { valor: 'CAMINA_CON_AYUDA', titulo: 'Camina con ayuda', detalle: 'Se mueve por sus medios con apoyo' },
  { valor: 'SILLA_DE_RUEDAS', titulo: 'Silla de ruedas', detalle: 'No camina, pero se mantiene sentado' },
  { valor: 'CAMILLA', titulo: 'Camilla', detalle: 'No se levanta, no camina y no puede sentarse' },
]

type Ficha = { movilidad: Movilidad; oxigeno: boolean; equipo: boolean }

type Props = {
  abierto: boolean
  /** Lo que dice la ficha del traslado: de ahí se parte, y se corrige solo lo que no coincide con lo que se ve. */
  ficha: Ficha
  /** Por qué el servidor no lo devolvió: con lo marcado, esta misma unidad alcanza para llevarlo. */
  aviso: string | null
  enviando: boolean
  /** Devolverlo registra dónde estaba la unidad: sin ubicación no se puede confirmar. */
  sinPosicion: boolean
  onConfirmar: (datos: Ficha) => void
  onCerrar: () => void
}

/**
 * No se elige un tipo de ambulancia: se corrige cómo está el paciente, que es lo que el paramédico tiene delante.
 * De ahí el sistema vuelve a derivar la unidad que hace falta, con la misma regla de siempre.
 */
export function DialogoUnidadNoCorresponde({ abierto, ficha, aviso, enviando, sinPosicion, onConfirmar, onCerrar }: Props) {
  const tema = useTheme()
  const [movilidad, setMovilidad] = useState<Movilidad>(ficha.movilidad)
  const [oxigeno, setOxigeno] = useState(ficha.oxigeno)
  const [equipo, setEquipo] = useState(ficha.equipo)

  // Cada vez que se abre arranca de la ficha, no de lo que quedó marcado la vez anterior.
  useEffect(() => {
    if (abierto) {
      setMovilidad(ficha.movilidad)
      setOxigeno(ficha.oxigeno)
      setEquipo(ficha.equipo)
    }
  }, [abierto, ficha.movilidad, ficha.oxigeno, ficha.equipo])

  return (
    <Sheet modal open={abierto} onOpenChange={(valor: boolean) => !valor && onCerrar()} snapPointsMode="fit">
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" p={20} gap={12} borderTopLeftRadius={20} borderTopRightRadius={20}>
        <H2 color="$texto" fontSize={19} lineHeight={26} fontWeight="600">
          ¿Cómo está el paciente?
        </H2>
        <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
          El pedido vuelve a la cola con el requerimiento corregido y se le busca una unidad que sirva.
        </Paragraph>

        {MOVILIDADES.map((opcion) => (
          <Opcion
            key={opcion.valor}
            titulo={opcion.titulo}
            detalle={opcion.detalle}
            elegida={movilidad === opcion.valor}
            onPress={() => setMovilidad(opcion.valor)}
          />
        ))}

        <Opcion titulo="Necesita oxígeno" detalle="" elegida={oxigeno} onPress={() => setOxigeno(!oxigeno)} />
        <Opcion
          titulo="Tiene vía, sonda o monitoreo"
          detalle=""
          elegida={equipo}
          onPress={() => setEquipo(!equipo)}
        />

        {/* Si esta misma unidad alcanza, no hay nada que devolver: se dice acá, para corregir lo marcado o subirlo. */}
        {aviso ? (
          <XStack gap={10} px={14} py={12} rounded={14} borderWidth={1} borderColor="$enAtencion" bg="$enAtencionTinte">
            <Feather name="alert-triangle" size={18} color={tema.enAtencionTexto?.val} />
            <Paragraph flex={1} color="$texto" fontSize={14} lineHeight={20}>
              {aviso}
            </Paragraph>
          </XStack>
        ) : null}

        {/* Como en los hitos: sin ubicación el botón queda apagado y se dice por qué, en vez de no hacer nada. */}
        {sinPosicion ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
            Esperando tu ubicación para poder devolver el traslado
          </Paragraph>
        ) : null}
        <BotonPrincipal
          disabled={enviando || sinPosicion}
          opacity={enviando || sinPosicion ? 0.6 : 1}
          icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
          onPress={() => onConfirmar({ movilidad, oxigeno, equipo })}
        >
          <Button.Text color="$primarioTexto" fontSize={16} fontWeight="600">
            Devolver el traslado
          </Button.Text>
        </BotonPrincipal>
        <Button chromeless height={48} disabled={enviando} onPress={onCerrar}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Cancelar
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}

function Opcion({
  titulo,
  detalle,
  elegida,
  onPress,
}: {
  titulo: string
  detalle: string
  elegida: boolean
  onPress: () => void
}) {
  return (
    <YStack
      gap={2}
      px={14}
      py={12}
      rounded={12}
      borderWidth={1}
      borderColor={elegida ? '$primario' : '$borde'}
      bg={elegida ? '$primarioTinte' : 'transparent'}
      pressStyle={{ bg: '$fondo' }}
      onPress={onPress}
    >
      <Text fontSize={15} fontWeight="600" color="$texto">
        {titulo}
      </Text>
      {detalle ? (
        <Text fontSize={13} lineHeight={18} color="$textoSecundario">
          {detalle}
        </Text>
      ) : null}
    </YStack>
  )
}
