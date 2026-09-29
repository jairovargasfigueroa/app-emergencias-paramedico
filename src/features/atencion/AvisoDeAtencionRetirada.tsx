import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, YStack, useTheme } from 'tamagui'

import { direccionIncidenteQuery } from '@/features/incidentes/queries'
import { irAInicio } from '@/shared/navegacion/inicio'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import {
  descartarAtencionRetirada,
  useAtencionRetirada,
  type AtencionRetirada,
  type TrasladoRetirado,
} from './atencionRetirada'

/** "el traslado de Ana Rojas", o solo "el traslado" si la app no tenía el nombre a mano. */
function elTraslado(pasajero: string | null) {
  return pasajero ? `el traslado de ${pasajero}` : 'el traslado'
}

function textosDelTraslado({ pasajero, motivo }: TrasladoRetirado) {
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
 * Una emergencia no tiene push que diga qué pasó: pudo cerrarla la central o un compañero de turno desde su teléfono.
 * Se dice solo lo cierto, con el lugar si ya se sabe su dirección.
 */
function textosDeLaEmergencia(direccion: string | null | undefined) {
  return {
    titulo: 'La atención ya no está en curso',
    mensaje: `La atención de ${direccion ?? 'esta emergencia'} ya no está en curso en tu unidad.`,
  }
}

/** Qué atención se avisa. Un traslado se reconoce por el traslado: es lo único que trae su push. */
function claveDe(retiro: AtencionRetirada) {
  return retiro.tipo === 'traslado' ? `traslado-${retiro.trasladoId}` : `atencion-${retiro.atencionId}`
}

/**
 * La unidad se quedó sin la atención que estaba haciendo: le sacaron el traslado, o la central o un compañero de turno
 * la cerró. La pantalla de la atención desaparece, así que se lleva al paramédico a Inicio y se le dice qué pasó. Es
 * un aviso que se cierra a mano y no un toast que se va solo: un cambio así no puede pasar sin que se lea.
 */
export function AvisoDeAtencionRetirada() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const retiro = useAtencionRetirada()
  // Mientras se cierra, sigue mostrando el último aviso en lugar de quedar vacío.
  const [ultimo, setUltimo] = useState(retiro)
  const clave = retiro ? claveDe(retiro) : null

  useEffect(() => {
    if (retiro) {
      setUltimo(retiro)
    }
  }, [retiro])

  useEffect(() => {
    if (clave !== null) {
      irAInicio()
    }
  }, [clave])

  const mostrado = retiro ?? ultimo
  // La dirección casi siempre ya está en caché: la buscó la pantalla de la atención mientras la unidad iba para allá.
  const incidente = mostrado?.tipo === 'emergencia' ? mostrado.incidente : null
  const direccion = useQuery({
    ...direccionIncidenteQuery(incidente ?? { id: 0, latitud: 0, longitud: 0 }),
    enabled: incidente !== null,
  }).data
  const { titulo, mensaje } = !mostrado
    ? { titulo: '', mensaje: '' }
    : mostrado.tipo === 'traslado'
      ? textosDelTraslado(mostrado)
      : textosDeLaEmergencia(direccion)

  return (
    <Sheet
      modal
      open={retiro !== null}
      onOpenChange={(abierto: boolean) => {
        if (!abierto) {
          descartarAtencionRetirada()
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

        <BotonPrincipal onPress={descartarAtencionRetirada}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Entendido
          </Button.Text>
        </BotonPrincipal>
      </Sheet.Frame>
    </Sheet>
  )
}
