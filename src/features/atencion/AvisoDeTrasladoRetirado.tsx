import Feather from '@expo/vector-icons/Feather'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, YStack, useTheme } from 'tamagui'

import { irAInicio } from '@/shared/navegacion/inicio'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { descartarTrasladoRetirado, useTrasladoRetirado, type TrasladoRetirado } from './trasladoRetirado'

/** "el traslado de Ana Rojas", o solo "el traslado" si la app no tenía el nombre a mano. */
function elTraslado(pasajero: string | null) {
  return pasajero ? `el traslado de ${pasajero}` : 'el traslado'
}

function textosDelRetiro({ pasajero, motivo }: TrasladoRetirado) {
  switch (motivo) {
    case 'CANCELADA_POR_SOLICITANTE':
      return { titulo: 'Traslado cancelado', mensaje: `Cancelaron ${elTraslado(pasajero)}. Tu unidad quedó libre.` }
    case 'REASIGNADA':
      return {
        titulo: 'Traslado reasignado',
        mensaje: `Le pasaron ${elTraslado(pasajero)} a otra unidad. Tu unidad quedó libre.`,
      }
    default: {
      // Sin push no se sabe qué pasó: pudo cancelarse, pasarse a otra unidad o cerrarlo un compañero de turno desde
      // su teléfono. Se dice solo lo cierto.
      const cual = pasajero ? `El traslado de ${pasajero}` : 'Este traslado'
      return {
        titulo: 'El traslado ya no está en curso',
        mensaje: `${cual} ya no está en curso en tu unidad.`,
      }
    }
  }
}

/**
 * Le sacaron el traslado a la unidad: lo canceló quien lo pidió o la central se lo pasó a otra. La pantalla del
 * traslado desaparece, así que se lleva al paramédico a Inicio y se le dice por qué. Es un aviso que se cierra a mano
 * y no un toast que se va solo: un cambio así no puede pasar sin que se lea.
 */
export function AvisoDeTrasladoRetirado() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const retiro = useTrasladoRetirado()
  // Mientras se cierra, sigue mostrando el último aviso en lugar de quedar vacío.
  const [ultimo, setUltimo] = useState(retiro)
  const trasladoId = retiro?.trasladoId ?? null

  useEffect(() => {
    if (retiro) {
      setUltimo(retiro)
    }
  }, [retiro])

  useEffect(() => {
    if (trasladoId !== null) {
      irAInicio()
    }
  }, [trasladoId])

  const mostrado = retiro ?? ultimo
  const { titulo, mensaje } = mostrado ? textosDelRetiro(mostrado) : { titulo: '', mensaje: '' }

  return (
    <Sheet
      modal
      open={retiro !== null}
      onOpenChange={(abierto: boolean) => {
        if (!abierto) {
          descartarTrasladoRetirado()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={18}
        px={20}
        pt={28}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <YStack width={52} height={52} rounded={999} bg="$enAtencionTinte" items="center" justify="center">
          <Feather name="alert-triangle" size={24} color={tema.enAtencionTexto?.val} />
        </YStack>

        <YStack gap={8}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            {titulo}
          </H2>
          <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
            {mensaje}
          </Paragraph>
        </YStack>

        <BotonPrincipal onPress={descartarTrasladoRetirado}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Entendido
          </Button.Text>
        </BotonPrincipal>
      </Sheet.Frame>
    </Sheet>
  )
}
