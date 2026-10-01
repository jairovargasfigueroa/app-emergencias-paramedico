import { useState, type Ref } from 'react'
import { Input, Text, XStack, YStack, type TamaguiElement } from 'tamagui'

/** Los códigos que se escriben en cajitas, como el PIN, son de 6 números. */
const LARGO = 6

type Props = {
  valor: string
  /** Recibe solo dígitos, como mucho 6. */
  onCambiar: (valor: string) => void
  /** Se llama al escribir el sexto dígito, con el código completo. */
  onCompletar?: (valor: string) => void
  /** Un punto en vez de cada número. Lo decide el padre, que es el que tiene el botón para mostrarlo. */
  oculto?: boolean
  /** Pinta las cajitas con el color de error. */
  error?: boolean
  /** Lo que anuncia el lector de pantalla al llegar al campo, como "Crea tu PIN". */
  etiqueta: string
  /** Para que un `Label` con `htmlFor` le pase el foco. */
  id?: string
  /** `$fondo` cuando van sobre una superficie blanca, como en una hoja. */
  fondo?: '$superficie' | '$fondo'
  onBlur?: () => void
  ref?: Ref<TamaguiElement>
}

/**
 * Un código de 6 números en cajitas, una por dígito: de un vistazo se ve cuántos van y cuántos faltan, aunque se
 * escriba con guantes y con la ambulancia en movimiento. Tamagui no trae uno.
 *
 * Lo escrito lo recibe un único campo invisible puesto encima de las cajitas, no un campo por cajita: así pegar,
 * borrar hacia atrás y el teclado funcionan como en cualquier campo. Y tocar una cajita es tocar ese campo, que vuelve
 * a abrir el teclado aunque se haya cerrado con el botón atrás de Android; enfocarlo desde el código no lo abriría.
 */
export function CajitasDeCodigo({
  valor,
  onCambiar,
  onCompletar,
  oculto = false,
  error = false,
  etiqueta,
  id,
  fondo = '$superficie',
  onBlur,
  ref,
}: Props) {
  const [enfocado, setEnfocado] = useState(false)
  // La que toca escribir. Con el código completo, la última: es la que se va con la tecla de borrar.
  const siguiente = Math.min(valor.length, LARGO - 1)

  function cambiar(texto: string) {
    // Lo pegado puede traer espacios, guiones o números de más: quedan los primeros 6 dígitos.
    const limpio = texto.replace(/\D/g, '').slice(0, LARGO)
    if (limpio === valor) {
      return
    }
    onCambiar(limpio)
    if (limpio.length === LARGO) {
      onCompletar?.(limpio)
    }
  }

  return (
    <YStack>
      {/*
        Cada cajita parte de 48 de ancho y crece hasta llenar la fila: con 4 de separación, seis de 48 caben en un
        teléfono de 360 de ancho. Solo se achican si en la configuración se agrandó la pantalla, y ahí ya se ven más
        grandes; un mínimo fijo las sacaría de la pantalla.
      */}
      <XStack gap={4} aria-hidden>
        {Array.from({ length: LARGO }, (_, indice) => {
          const digito = valor[indice]
          const resaltada = enfocado && indice === siguiente
          return (
            <YStack
              key={indice}
              grow={1}
              shrink={1}
              flexBasis={48}
              maxW={64}
              height={56}
              rounded={12}
              borderWidth={resaltada ? 2 : 1}
              borderColor={error || resaltada ? '$primario' : '$bordeFuerte'}
              bg={fondo}
              items="center"
              justify="center"
            >
              {digito === undefined ? null : oculto ? (
                <YStack width={12} height={12} rounded={999} bg="$texto" />
              ) : (
                <Text color="$texto" fontFamily="$mono" fontSize={24}>
                  {digito}
                </Text>
              )}
            </YStack>
          )
        })}
      </XStack>

      <Input
        ref={ref}
        id={id}
        unstyled
        position="absolute"
        t={0}
        r={0}
        b={0}
        l={0}
        // Casi invisible, pero no del todo: con opacidad 0, iOS no le pasa los toques y el lector de Android lo salta.
        opacity={0.02}
        caretHidden
        value={valor}
        onChangeText={cambiar}
        // El cursor siempre al final: se escribe y se borra de a un dígito, desde la última cajita.
        selection={{ start: valor.length, end: valor.length }}
        onFocus={() => setEnfocado(true)}
        onBlur={() => {
          setEnfocado(false)
          onBlur?.()
        }}
        keyboardType="number-pad"
        // Oculto, también es un campo de contraseña: el lector de pantalla no dice los números en voz alta y el
        // teclado no los aprende.
        secureTextEntry={oculto}
        // Ni se guarda ni se sugiere: si el autocompletado lo recordara, pedirlo no probaría quién tiene el teléfono.
        autoComplete="off"
        importantForAutofill="no"
        textContentType="none"
        autoCorrect={false}
        spellCheck={false}
        accessibilityLabel={etiqueta}
      />
    </YStack>
  )
}
