# Pendientes — Problemas del Tomo II

**Al día el 23/11/2026.**

- **Lo que quedó del control de los 72 QR (23/11), que sólo se arregla en el
  motor (`engine.js`) o que no estaba en el encargo.** — Claude, cuando Juani
  diga. Detalle en `libro-tomo-ii/revision-impresa-nov-2026/control-qr-23-11/`.
  - Las celdas de la grilla aceptan sólo enteros de 2 cifras: «4/3» llega
    como 43 (U1 #4) y no hay inversas con fracciones (U1 #16).
  - «Ver respuesta» muestra un texto fijo (`answerText`) en U3 #5 y #9; la
    cuenta completa sólo sale al responder mal.
  - U2 #11, #12, #13 y #16 usan M₂ₓ₃, M₃ₓ₂ y P₃, que el libro no usa en la U2.
    El generador de la U2 #11 da siempre conjuntos LI.
  - U1 #24: ~15 % son 4×4 al azar que sólo se resuelven con el determinante.
    U1 #22: a veces aparece «\frac{1}{1}». U1 #19 y #27: algunos números
    sin KaTeX («-4», «E(3,1;-2)»).
  - Sin probar en un teléfono real ni en el modo examen con una cuenta
    registrada.
- **Pasar el modo examen (`exam.js`) al tema «Hoja del libro».** — Claude, cuando
  Juani lo pida. Las actividades, los índices y los modales cambiaron el 13/11
  (motor v5.0); el modo examen tiene su propio CSS y sigue con el tema
  pizarrón oscuro. Para probarlo entero hace falta entrar con una cuenta
  registrada.
