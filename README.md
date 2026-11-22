# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Demo:

[Asteroids demo](https://klerith.github.io/claude-asteroids/)

## Descripción del juego

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Limpia todos los asteroides para pasar al siguiente nivel, que trae uno más que el anterior.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-up: Disparo Triple

Al destruir un asteroide hay un **10 %** de probabilidad de que aparezca un círculo cian flotante. Solo aparece **una vez por partida**.

- Pasa con la nave por encima para recogerlo.
- Durante **10 segundos** cada disparo lanza **3 balas en abanico**.
- El tiempo restante se muestra arriba a la izquierda, con una barra.
- Si no lo recoges, parpadea y desaparece a los 8 segundos.
- Se pierde al morir, pero se conserva al pasar de nivel.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Niveles con dificultad creciente
- Power-up de disparo triple
