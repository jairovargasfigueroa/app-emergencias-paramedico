import { useState } from 'react'
import { Button, H2, Paragraph, Sheet, Spinner, Text, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { Movilidad } from './api'

const MOVILIDADES: { valor: Movilidad; titulo: string; detalle: string }[] = [
  { valor: 'CAMINA_CON_AYUDA', titulo: 'Camina con ayuda', detalle: 'Se mueve por sus medios con apoyo' },
  { valor: 'SILLA_DE_RUEDAS', titulo: 'Silla de ruedas', detalle: 'No camina, pero se mantiene sentado' },
  { valor: 'CAMILLA', titulo: 'Camilla', detalle: 'No se levanta, no camina y no puede sentarse' },
]

type Props = {
  abierto: boolean
  enviando: boolean
  onConfirmar: (datos: { movilidad: Movilidad; oxigeno: boolean; equipo: boolean }) => void
  onCerrar: () => void
}

/**
 * No se elige un tipo de ambulancia: se corrige cómo está el paciente, que es lo que el paramédico tiene delante.
 * De ahí el sistema vuelve a derivar la unidad que hace falta, con la misma regla de siempre.
 */
export function DialogoUnidadNoCorresponde({ abierto, enviando, onConfirmar, onCerrar }: Props) {
  const [movilidad, setMovilidad] = useState<Movilidad>('CAMILLA')
  const [oxigeno, setOxigeno] = useState(false)
  const [equipo, setEquipo] = useState(false)

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

        <BotonPrincipal
          disabled={enviando}
          opacity={enviando ? 0.6 : 1}
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
