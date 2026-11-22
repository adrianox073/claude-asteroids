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

## Power-ups

Al destruir un asteroide hay un **10 %** de probabilidad de que aparezca un power-up flotante. Cada tipo aparece **una vez por partida** y solo hay uno en pantalla a la vez.

- Pasa con la nave por encima para recogerlo.
- El tiempo restante se muestra arriba a la izquierda, con una barra.
- Si no lo recoges, parpadea y desaparece a los 8 segundos.
- Los efectos se pierden al morir, pero se conservan al pasar de nivel.

| Power-up        | Color    | Efecto                                                                                                   |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| Disparo Triple  | Cian     | Durante **10 segundos** cada disparo lanza **3 balas en abanico**.                                         |
| Escudo Temporal | Amarillo | Un círculo de energía rodea la nave durante **5 segundos** y absorbe **un impacto** de asteroide, que se destruye. |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Niveles con dificultad creciente
- Power-ups de disparo triple y escudo temporal
