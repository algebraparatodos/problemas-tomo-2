# Problemas del Tomo II

Las 72 actividades interactivas de **Álgebra Para Todos, Tomo II**. Cada tema
del libro impreso lleva un código QR; el QR abre una landing, la landing carga
estos scripts, y el estudiante resuelve el ejercicio en el teléfono con
corrección inmediata.

Los ejercicios se **generan al azar en cada carga**: los coeficientes, las
matrices y las opciones cambian, así que el mismo QR no da dos veces el mismo
problema. Eso es lo que permite que sirvan para practicar y no sólo para mirar
la respuesta una vez.

## Las cuatro unidades

| Unidad | Tema | Actividades |
|---|---|---|
| 1 | Sistemas de ecuaciones y matrices | 27 |
| 2 | Espacios vectoriales | 17 |
| 3 | Transformaciones lineales | 16 |
| 4 | Autovalores, diagonalización y aplicaciones | 12 |

Desde clasificar un sistema por Rouché-Frobenius con un parámetro, hasta
calcular un polinomio característico, una potencia de matriz o una cadena de
Markov.

## Cómo está armado

Un solo motor compartido y una lógica corta por actividad:

```
engine.js                 el motor: CSS, tipografías, KaTeX, sonido,
                          catálogo, modal de reporte, modo compacto
unidad-N.js               resuelve qué actividad mostrar según el
                          fragmento de la URL (/qrt2u1#7)
actividades/*.js          SOLO la matemática de cada ejercicio
```

La landing de cada unidad no sabe nada: carga `engine.js` y el archivo de la
actividad, y el archivo se monta solo en el lugar donde está el `<script>`.

El motor soporta tres formas de responder, que cubren las 72:

- **`choices`**: botones de opción, por ejemplo SCD / SCI / SI.
- **`grid`**: una grilla de celdas numéricas con signo, para cargar una matriz
  o un vector entero.
- **`multiselect`**: varias respuestas correctas a la vez, para «marcá todas
  las que sean base».

## Por qué el motor es uno solo

Hay una landing por unidad y 72 ejercicios detrás. Si la paleta, la
tipografía, el pie o la notación vivieran en cada archivo, un cambio de estilo
obligaría a volver a pegar 72 scripts a mano en Kajabi, y el que se olvidara
quedaría distinto para siempre sin que nadie lo note.

El caso concreto que lo justifica es la notación: **las matrices van entre
paréntesis**, para coincidir con el libro impreso, porque dos barras
verticales significan determinante y lo convertirían en un número. Los
delimitadores se dibujan con las clases del motor (`.apt-act__matrixwrap` y
`.apt-act__bracket`), así que el día que cambie la notación cambia en un solo
archivo y llega a las 72.

## Las URLs son parte del contrato

El esquema es una landing por unidad con el número de actividad en el
fragmento: `/qrt2u1#7`. **Los QR ya están impresos en el libro**, así que una
URL que cambie deja muerto un código de papel que no se puede corregir.

## Servido desde aquí

Este repositorio es público a propósito: las landings cargan los scripts
directamente desde GitHub Pages.

```html
<script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"></script>
<script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-1-clasifica-el-sistema.js"></script>
```

Sin compilar, sin dependencias y sin paso de despliegue: un commit aquí y el
ejercicio cambia para todos los que abran el QR.

## El libro

**Álgebra Para Todos** es un manual de álgebra lineal para primer año de
ingeniería y ciencias, de Juan Ignacio Silva. Más en
[algebraparatodos.com](https://algebraparatodos.com).
