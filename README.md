# ANODEFLEX 2 + 2 nodos · 1 inyección

Aplicación web para obtener las resistencias del sistema mediante dos grupos de mediciones y regular después las ocho ramas desde una sola inyección.

## Mediciones de campo

- Lado A: fuente VA → Rc1 → nodo 1 → Rc2 → nodo 2. Ramas R11, R12, R21 y R22.
- Lado B: fuente VB → Rc3 → nodo 3 → Rc4 → nodo 4. Ramas R31, R32, R41 y R42.

Las mediciones A y B se calculan de forma independiente con los reóstatos en 0 Ω.

## Regulación

Una única fuente alimenta el sistema desde el nodo 1. La corriente recorre en secuencia Rc1, Rc2, Rc3 y Rc4. En cada nodo están conectadas sus dos ramas correspondientes.

La regulación calcula el voltaje mínimo y los reóstatos a partir de las ocho corrientes objetivo. Al menos un reóstato queda en 0 Ω. El voltaje y los reóstatos también pueden editarse manualmente. Los casos se pueden exportar e importar como archivos JSON.

GitHub Pages sirve el contenido de la carpeta `docs`.
