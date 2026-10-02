import Feather from '@expo/vector-icons/Feather'
import { Button, Spinner, useTheme } from 'tamagui'

type Props = {
  texto: string
  icono?: 'play' | 'pause'
  cargando: boolean
  onPress: () => void
}

/** Botón grande para empezar, pausar o seguir un audio o un video. */
export function BotonReproducir({ texto, icono = 'play', cargando, onPress }: Props) {
  const tema = useTheme()
  return (
    <Button
      self="flex-start"
      height={48}
      px={18}
      rounded={12}
      bg="$superficie"
      borderColor="$bordeFuerte"
      disabled={cargando}
      icon={cargando ? <Spinner color="$texto" /> : <Feather name={icono} size={20} color={tema.texto?.val} />}
      onPress={onPress}
    >
      <Button.Text color="$texto" fontSize={16} fontWeight="600">
        {texto}
      </Button.Text>
    </Button>
  )
}
