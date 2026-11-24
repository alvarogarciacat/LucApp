# Luca en Movimiento

Juegos para moverse delante de la cámara, para niños de unos 5 años. La cámara del móvil o del ordenador ve el cuerpo entero (cabeza, brazos y piernas) y lo convierte en un personaje de dibujos. No hace falta saber leer: una voz en español explica cada cosa y la pantalla lo enseña con dibujos grandes.

## Juegos

| Juego | Qué hace el niño | Qué aprende |
|---|---|---|
| 🫧 Burbujas | Explota con las manos o los pies la burbuja que dice la voz | Números del 1 al 10, letras y colores |
| 🍎 Frutas | Atrapa con las manos las frutas que le piden ("¡Atrapa tres fresas!") | Contar y reconocer frutas |
| 🌴 Selva | Salta los troncos, se agacha bajo las ramas y estira los brazos para coger estrellas | Coordinación y contar saltos |
| 🧱 Muro mágico | Copia la postura del dibujo (árbol, avión, estrella…) para atravesar el muro | Esquema corporal y equilibrio |

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

**GitHub Pages:** en el repositorio, ve a *Settings → Pages → Source: GitHub Actions*. Cada push a `main` publica la app sola.

**Firebase Hosting:**

```bash
npm install -g firebase-tools
firebase login
firebase use --add      # elige o crea tu proyecto
npm run build && firebase deploy
```

Una vez abierta en Chrome del móvil, usa *Menú → Añadir a pantalla de inicio* y queda como una app. Después de la primera vez funciona sin internet.

## Estructura

- `src/pose.js`: cámara y detección del cuerpo (MediaPipe, con el modelo y el wasm incluidos en `public/`)
- `src/body.js`: esqueleto en pantalla, detección de saltos, agacharse y posturas
- `src/avatar.js`: el personaje dibujado sobre el cuerpo
- `src/games/*.js`: un archivo por juego
- `src/voice.js` y `src/sfx.js`: la voz y los sonidos
