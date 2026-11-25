# LucApp

Juegos para moverse delante de la cámara, para niños de unos 5 años. La cámara del móvil o del ordenador ve el cuerpo entero (cabeza, brazos y piernas) y lo convierte en un personaje de dibujos. No hace falta saber leer: una voz en español explica cada cosa y la pantalla lo enseña con dibujos grandes.

## Juegos (21)

**Aprender tocando** (con las manos, delante de la cámara)

| Juego | Qué hace el niño | Qué aprende |
|---|---|---|
| 🫧 Burbujas | Explota la burbuja que dice la voz | Números, letras, colores |
| 🔺 Formas | Toca la forma que le piden | Círculo, cuadrado, triángulo, estrella, corazón, rombo |
| 🐮 Animales | Toca el animal por su nombre o por su sonido ("¿quién hace muuu?") | Animales y sus sonidos |
| 🔢 Cuenta | Cuenta los dibujos y toca el número | Contar hasta 6 |
| 🎲 Dados | Toca el dado con X puntos | Reconocer cantidades |
| 🔤 Mi nombre | Toca las letras en orden: L-U-C-A, M-A-M-A, P-A-P-A, S-O-L | Sus primeras letras |
| 🍎 Frutas | Atrapa las frutas que le piden mientras caen | Contar y frutas |

**Arcade**

| Juego | Qué hace el niño |
|---|---|
| 🐹 Topos | Da a los topos que salen de los agujeros |
| 🥁 Tambores | Repite la secuencia de colores y sonidos (memoria) |
| 🪟 Ventana | Frota la ventana sucia para descubrir el animal que hay detrás |
| 🌟 Estírate | Coge estrellas muy arriba, abajo con el pie y a los lados |
| ⚽ Portero | Para los balones con manos o pies |

**Todo el cuerpo**

| Juego | Qué hace el niño |
|---|---|
| 🙋 Luca dice | Tócate la cabeza, la barriga, las rodillas, da una palmada, salta… |
| 🕺 Baila | Copia los pasos de baile al ritmo |
| 🗿 Estatuas | Baila con la música y se queda quieto cuando para |
| 🌴 Selva | Salta troncos, se agacha bajo ramas y coge estrellas |
| 🐸 Ranita | Salta X veces para que la rana cruce el estanque |
| 🐦 Vuela | Mueve los brazos como alas para volar y coger estrellas |
| ☃️ Esquiva | Se mueve a los lados para esquivar bolas de nieve |
| ⛷️ Esquí | Se mueve hacia la puerta del color que le piden |
| 🧱 Muro mágico | Copia la postura del dibujo para atravesar el muro |

Nunca se pierde. Si se atasca, la burbuja correcta brilla, el obstáculo espera y la voz le vuelve a explicar qué hacer. Las estrellas desbloquean personajes: Dino, Robot (10★), Astronauta (25★) y Superhéroe (50★).

## Cómo se monta

1. Pon el móvil de pie y en horizontal, a la altura de la cintura del niño.
2. El niño se pone a 2 o 3 pasos, para que la cámara le vea de la cabeza a los pies.
3. Para jugar en la tele, duplica la pantalla del móvil (Chromecast, Smart View o AirPlay).
4. Sin cámara se puede jugar con el dedo. Se cambia con el botón 📷 del menú.

La imagen de la cámara se procesa solo dentro del dispositivo, con MediaPipe Pose. No se graba ni se envía nada.

## Desarrollo

```bash
npm install
npm run dev      # abre la URL que aparece en el móvil (misma wifi)
npm run build    # genera dist/
```

En el móvil, la cámara solo funciona con HTTPS. Para probar en local desde el teléfono, usa la versión publicada o un túnel HTTPS.

## Publicar

La web se publica con GitHub Pages desde este mismo repositorio. Cada push a `main` la vuelve a publicar automáticamente.

La Action deja la app construida en la rama `gh-pages`. Configuración (una sola vez): *Settings → Pages → Deploy from a branch → gh-pages / (root)*.

La app queda en https://alvarogarciacat.github.io/LucApp/

**Firebase Hosting** (alternativa):

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build && firebase deploy
```

Una vez abierta en Chrome del móvil, usa *Menú → Añadir a pantalla de inicio* y queda como una app. Después de la primera vez funciona sin internet.

## Estructura

- `src/pose.js`: cámara y detección del cuerpo (MediaPipe, con el modelo y el wasm incluidos en `public/`)
- `src/body.js`: esqueleto en pantalla, detección de saltos, agacharse y posturas
- `src/avatar.js`: el personaje dibujado sobre el cuerpo
- `src/games/*.js`: un archivo por juego
- `src/voice.js` y `src/sfx.js`: la voz y los sonidos
