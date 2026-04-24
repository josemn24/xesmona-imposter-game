# MVP App Web Juego del Impostor

## Especificación técnica y funcional para Producto y Desarrollo

**Estado:** Borrador listo para refinamiento
**Idioma del producto:** Español en MVP
**Plataforma objetivo:** Web responsive mobile-first
**Audiencia del documento:** Product Owner, Diseño, Frontend, Backend, QA

---

# 1. Propósito del documento

Este documento define el **MVP** de una app web del juego social **Impostor de palabras**, con el nivel de detalle necesario para que los equipos de producto y desarrollo puedan diseñar, implementar, probar y lanzar una primera versión usable.

El objetivo del MVP es permitir partidas locales presenciales con un solo dispositivo, minimizando fricción de uso y asegurando privacidad en la asignación de roles.

Este documento cubre:

- alcance del MVP;
- objetivos de producto;
- reglas del juego soportadas;
- flujos funcionales;
- requisitos funcionales y no funcionales;
- modelo de datos de alto nivel;
- arquitectura propuesta;
- criterios de aceptación;
- exclusiones del MVP.

---

# 2. Resumen ejecutivo

Se desarrollará una **app web mobile-first** para jugar al juego del impostor de palabras en modo **pass-and-play** sobre un único dispositivo.

## Propuesta de valor del MVP

La app debe permitir que un grupo de jugadores:

1. configure una partida en menos de 1 minuto;
2. reciba roles de forma privada y segura;
3. juegue rondas rápidas guiadas por la app;
4. vote al sospechoso;
5. vea la resolución y puntuación;
6. encadene varias rondas sin reconfigurar la partida completa.

## Principios de producto del MVP

- **Rapidez:** mínima fricción para empezar.
- **Privacidad:** nadie debe ver el rol o palabra de otro jugador.
- **Claridad:** la app debe guiar sin sobreexplicar.
- **Rejugabilidad:** soporte para múltiples rondas, categorías y puntuación.
- **Simplicidad:** evitar complejidad online en la primera versión.

---

# 3. Objetivos del MVP

## 3.1 Objetivos de negocio

- Validar interés y usabilidad del concepto en web.
- Lanzar una primera versión jugable sin necesidad de cuentas ni multijugador online.
- Obtener datos tempranos de uso: tiempo a primera partida, rondas completadas, abandono por pantalla, categorías más jugadas.

## 3.2 Objetivos de usuario

El usuario debe poder:

- crear una partida rápidamente;
- añadir jugadores sin esfuerzo;
- jugar sin conocer reglas avanzadas;
- completar una ronda sin intervención manual externa;
- repetir rondas manteniendo el grupo y la configuración principal.

## 3.3 Métricas de éxito iniciales

- Tiempo medio hasta inicio de partida < 60 segundos.
- Ratio de partida iniciada tras abrir la app > 60%.
- Al menos 3 rondas completadas por sesión en la media de sesiones jugadas.
- Tasa de abandono durante reparto de roles < 15%.

---

# 4. Alcance del MVP

## 4.1 Incluido en MVP

- Juego local en un solo dispositivo.
- Entre 3 y 10 jugadores.
- Alta manual de nombres.
- 1 impostor por ronda.
- 1 palabra secreta compartida por el resto de jugadores.
- Categorías predefinidas.
- Temporizador opcional por turno de pista.
- Debate libre fuera de la app.
- Votación secreta guiada por la app en el mismo dispositivo.
- Resolución de ronda.
- Puntuación acumulada.
- Varias rondas consecutivas.
- UI responsive optimizada para móvil.
- Persistencia local de la sesión actual.

## 4.2 Explícitamente fuera del MVP

- Multijugador online en tiempo real.
- Salas por código o QR.
- Login / registro de usuarios.
- Packs personalizados creados por usuarios.
- Roles avanzados: doble impostor, Mr. White, Undercover.
- Chat integrado.
- Rankings globales.
- Social sharing complejo.
- Soporte multiidioma completo.
- Panel de administración editorial avanzado.

---

# 5. Definición del juego soportado en el MVP

## 5.1 Reglas de negocio principales

En cada ronda:

- existe una palabra secreta;
- todos los jugadores salvo uno conocen esa palabra;
- el jugador que no la conoce es el **impostor**;
- cada jugador, por turno, da una pista verbal fuera de la app;
- tras la ronda de pistas, se abre debate libre;
- todos votan quién creen que es el impostor;
- se revela el resultado;
- si el votado es el impostor, este puede tener una opción final de adivinar la palabra si la regla está activada;
- se asignan puntos y se pasa a la siguiente ronda.

## 5.2 Parámetros configurables del MVP

- número de jugadores;
- categoría;
- número de rondas objetivo;
- tiempo por turno de pista;
- tiempo de debate;
- activación/desactivación de adivinanza final del impostor;
- activación/desactivación del temporizador.

## 5.3 Reglas fijas en MVP

- siempre hay exactamente 1 impostor;
- la votación es secreta;
- si hay empate, hay segunda votación entre empatados;
- si persiste el empate, la ronda termina sin expulsión y el impostor gana la ronda;
- el orden de jugadores rota automáticamente entre rondas.

---

# 6. Perfiles de usuario del MVP

## 6.1 Host informal

Jugador que abre la app, configura parámetros y actúa como facilitador del grupo.

Necesidades:

- iniciar rápido;
- entender el flujo sin leer manuales;
- evitar errores al pasar el móvil.

## 6.2 Jugador ocasional

Participa sin experiencia previa.

Necesidades:

- ver claramente cuándo le toca;
- entender qué hacer en cada paso;
- no quedar expuesto por una UI confusa.

---

# 7. User stories principales

## 7.1 Configuración

- Como host, quiero crear una partida en pocos pasos para empezar a jugar rápido.
- Como host, quiero introducir los nombres de los jugadores para personalizar turnos y votos.
- Como host, quiero elegir categoría y ajustes básicos para adaptar la partida al grupo.

## 7.2 Reparto de roles

- Como jugador, quiero ver mi rol y mi palabra de forma privada para que nadie más la vea.
- Como jugador, quiero ocultar mi pantalla antes de pasar el dispositivo para proteger la partida.

## 7.3 Juego de ronda

- Como grupo, queremos que la app indique claramente el orden de turnos para evitar confusión.
- Como grupo, queremos votar de forma simple y privada para que el resultado sea justo.
- Como grupo, queremos ver una resolución clara con palabra, impostor y puntos para pasar rápido a la siguiente ronda.

## 7.4 Continuidad

- Como host, quiero mantener el grupo entre rondas para no tener que reconfigurarlo todo.
- Como grupo, queremos ver el marcador acumulado para generar progresión.

---

# 8. Flujo principal de la aplicación

## 8.1 Flujo de alto nivel

1. Home
2. Crear partida
3. Configuración
4. Alta de jugadores
5. Reparto de roles
6. Fase de pistas
7. Debate
8. Votación
9. Resolución
10. Marcador
11. Siguiente ronda o fin de partida

---

# 9. Pantallas y comportamiento esperado

## 9.1 Pantalla Home

### Objetivo

Permitir empezar una partida nueva o continuar una sesión local interrumpida.

### Elementos

- Botón principal: **Nueva partida**
- Botón secundario: **Continuar partida** (solo si existe sesión local activa)
- Botón terciario: **Cómo se juega**
- Acceso a ajustes generales

### Comportamiento

- Si existe una partida activa persistida localmente, mostrar opción de reanudar.
- Si no existe, ocultar o deshabilitar “Continuar partida”.

### Criterios de aceptación

- El usuario puede iniciar una nueva partida desde home en un solo toque.
- Si había una partida activa, puede reanudarla sin pérdida de estado.

## 9.2 Pantalla Configuración de partida

### Objetivo

Definir los parámetros base del juego.

### Campos

- Número de jugadores: entero entre 3 y 10
- Categoría: selector simple
- Número de rondas: selector entre 1 y 20
- Temporizador por pista: off / 10s / 15s / 20s / 30s
- Debate: off / 60s / 90s / 120s
- Adivinanza final del impostor: on/off

### Validaciones

- No permitir continuar con menos de 3 jugadores.
- Debe existir al menos una categoría seleccionable.

### Criterios de aceptación

- Todos los valores deben persistirse al avanzar.
- El usuario puede volver atrás sin perder datos ya introducidos.

## 9.3 Pantalla Alta de jugadores

### Objetivo

Registrar nombres de jugadores.

### Elementos

- Lista editable de jugadores
- Inputs con placeholder “Jugador 1”, “Jugador 2”, etc.
- Botón “Autorrellenar nombres” opcional con nombres genéricos
- Botón “Continuar”

### Reglas

- No se permiten nombres vacíos al iniciar.
- Nombres duplicados se permiten, pero se recomienda advertencia visual.
- Longitud máxima recomendada: 20 caracteres.

### Criterios de aceptación

- El host puede editar cualquier nombre antes de empezar.
- Al continuar, se genera el orden inicial de juego.

## 9.4 Pantalla Reparto de roles

### Objetivo

Revelar de forma privada la palabra o el rol de cada jugador.

### Flujo

Para cada jugador:

1. Se muestra pantalla de espera con su nombre.
2. Botón principal: **Ver mi rol**.
3. El jugador mantiene pulsado o pulsa para revelar.
4. Se muestra:
   - si es jugador normal: palabra secreta;
   - si es impostor: mensaje “Eres el impostor”.

5. Botón: **Ocultar y pasar**.
6. Se pasa al siguiente jugador.

### Requisitos UX

- Pantalla sin elementos distractores.
- Fondo de alta privacidad visual.
- No mostrar historial ni navegación del navegador de forma prominente.
- Ocultar automáticamente el contenido al pulsar continuar.

### Criterios de aceptación

- Ningún jugador posterior puede ver el rol anterior una vez ocultado.
- La app no muestra en ningún momento una lista pública de roles.

## 9.5 Pantalla Fase de pistas

### Objetivo

Guiar el orden de los turnos de pista.

### Elementos

- Nombre del jugador actual
- Indicador de turno actual / total
- Temporizador visual si está activado
- Botón “Siguiente”

### Reglas

- La pista verbal sucede fuera de la app.
- La app no registra el contenido de la pista en MVP.
- Si el temporizador está desactivado, el avance es manual.

### Criterios de aceptación

- El orden de turnos debe coincidir con el orden de la ronda.
- La app debe poder avanzar aunque el temporizador llegue a cero.

## 9.6 Pantalla Debate

### Objetivo

Dar una transición clara entre pistas y votación.

### Elementos

- Texto: “Debatid quién es el impostor”
- Temporizador opcional
- Botón “Ir a votación”

### Reglas

- Si no hay temporizador, el usuario pasa manualmente.
- Si hay temporizador, al llegar a cero debe mostrarse CTA a votación.

### Criterios de aceptación

- Debe quedar claro que la conversación ocurre fuera de la app.

## 9.7 Pantalla Votación secreta

### Objetivo

Permitir que cada jugador vote en secreto a otro jugador.

### Flujo

Para cada votante:

1. Pantalla “Turno de votar: [nombre]”
2. Lista de jugadores votables
3. No se permite votarse a sí mismo
4. Selección de voto
5. Confirmación
6. Registro del voto
7. Paso al siguiente votante

### Reglas

- Un jugador emite un solo voto.
- El voto es irreversible una vez confirmado.
- No se muestran votos parciales.

### Casos especiales

- Empate: lanzar segunda votación solo entre empatados.
- Si persiste el empate, la ronda termina y el impostor gana.

### Criterios de aceptación

- Ningún usuario puede ver el voto anterior cuando recibe el dispositivo.
- La aplicación contabiliza correctamente votos y empates.

## 9.8 Pantalla Resolución

### Objetivo

Revelar el resultado de la ronda.

### Elementos

- Jugador expulsado / señalado
- Indicador de si era o no el impostor
- Palabra secreta
- Mensaje contextual de resultado

### Reglas

- Si el votado no era impostor: gana el impostor.
- Si el votado sí era impostor y la regla de adivinanza final está activa: mostrar pantalla adicional de intento de adivinanza.

## 9.9 Pantalla Adivinanza final del impostor

### Objetivo

Permitir al impostor intentar adivinar la palabra.

### Elementos

- Input de texto libre
- Botón confirmar

### Regla

- Comparación exacta normalizada o comparación con tolerancia mínima definida por producto.

### Recomendación MVP

- Implementar comparación exacta case-insensitive y trimmed.
- No implementar sinónimos en MVP.

### Criterios de aceptación

- Si acierta, se aplica la puntuación definida para acierto final.
- Si falla, se aplica la puntuación de derrota del impostor.

## 9.10 Pantalla Marcador y siguiente ronda

### Objetivo

Mostrar puntos acumulados y permitir seguir jugando.

### Elementos

- Tabla de jugadores y puntuación
- Número de ronda actual / total
- Botón “Siguiente ronda”
- Botón “Finalizar partida”

### Reglas

- Reutilizar lista de jugadores y configuración base.
- Rotar automáticamente el jugador inicial de la siguiente ronda.
- Elegir una nueva palabra en la misma categoría o categorías activas.

### Criterios de aceptación

- Las puntuaciones acumuladas deben mantenerse entre rondas.
- La siguiente ronda debe poder iniciarse sin volver a configurar la partida.

---

# 10. Sistema de puntuación del MVP

## Propuesta de puntuación

### Si el impostor sobrevive

- Impostor: +3
- Resto: +0

### Si el impostor es detectado pero adivina la palabra

- Impostor: +1
- Resto: +1

### Si el impostor es detectado y no adivina la palabra

- Resto de jugadores: +2 cada uno
- Impostor: +0

## Justificación

- Premia la supervivencia del impostor.
- Premia la deducción colectiva.
- Mantiene reglas simples de explicar.

## Nota de implementación

La lógica de puntuación debe abstraerse para poder cambiarse sin rediseñar todo el flujo.

---

# 11. Requisitos funcionales

## 11.1 Gestión de partida

- RF-001: El sistema debe permitir crear una partida nueva.
- RF-002: El sistema debe permitir configurar número de jugadores entre 3 y 10.
- RF-003: El sistema debe permitir seleccionar una categoría de palabras.
- RF-004: El sistema debe permitir definir duración de la partida en número de rondas.
- RF-005: El sistema debe persistir localmente una partida en curso.

## 11.2 Gestión de jugadores

- RF-006: El sistema debe permitir introducir y editar nombres de jugadores.
- RF-007: El sistema debe mantener el orden de jugadores de la ronda actual.
- RF-008: El sistema debe rotar el primer jugador entre rondas.

## 11.3 Lógica de roles y palabras

- RF-009: El sistema debe seleccionar aleatoriamente un impostor por ronda.
- RF-010: El sistema debe seleccionar una palabra válida de la categoría elegida.
- RF-011: El sistema debe revelar la palabra a todos los jugadores excepto al impostor.
- RF-012: El sistema no debe exponer públicamente el rol de ningún jugador antes de la resolución.

## 11.4 Flujo de ronda

- RF-013: El sistema debe guiar la fase de pistas por orden de jugadores.
- RF-014: El sistema debe soportar temporizador opcional en la fase de pistas.
- RF-015: El sistema debe soportar temporizador opcional en la fase de debate.
- RF-016: El sistema debe registrar un voto secreto por jugador.
- RF-017: El sistema no debe permitir votar por uno mismo.
- RF-018: El sistema debe resolver empates mediante segunda votación entre empatados.
- RF-019: El sistema debe cerrar la ronda sin expulsión si el empate persiste.

## 11.5 Resolución y puntuación

- RF-020: El sistema debe revelar la palabra secreta al finalizar la votación.
- RF-021: El sistema debe determinar si el jugador señalado era el impostor.
- RF-022: El sistema debe ejecutar la fase de adivinanza final si la regla está activada y el impostor ha sido descubierto.
- RF-023: El sistema debe asignar puntos automáticamente al finalizar la ronda.
- RF-024: El sistema debe mostrar un marcador acumulado por jugador.

## 11.6 Fin de partida

- RF-025: El sistema debe finalizar la partida al completar el número de rondas configurado.
- RF-026: El sistema debe mostrar un resumen final con ganador o líderes por puntuación.

---

# 12. Requisitos no funcionales

## 12.1 Plataforma y compatibilidad

- RNF-001: La app debe funcionar correctamente en navegadores móviles modernos.
- RNF-002: Debe ser responsive y usable en pantallas de 360px de ancho o superiores.
- RNF-003: Debe ser usable también en escritorio, aunque la experiencia objetivo es móvil.

## 12.2 Rendimiento

- RNF-004: El tiempo inicial de carga percibida debe ser bajo en redes móviles comunes.
- RNF-005: Las transiciones entre pantallas críticas deben sentirse instantáneas o casi instantáneas.

## 12.3 Usabilidad

- RNF-006: La UI debe ser comprensible por usuarios que no hayan jugado antes.
- RNF-007: Las acciones principales deben resolverse con CTA prominentes.
- RNF-008: El tamaño táctil mínimo recomendado de controles debe seguir buenas prácticas mobile.

## 12.4 Privacidad de juego

- RNF-009: La UI debe minimizar el riesgo de exposición accidental de la palabra durante el reparto y la votación.
- RNF-010: Los datos de roles y votos solo deben estar visibles en el contexto de quien interactúa en ese momento.

## 12.5 Resiliencia

- RNF-011: Si el usuario recarga accidentalmente, la app debe intentar recuperar la partida en curso desde almacenamiento local.
- RNF-012: La app debe tolerar pérdida temporal de conectividad si los assets ya están cargados.

## 12.6 Accesibilidad

- RNF-013: Contraste adecuado entre texto y fondo.
- RNF-014: Soporte razonable para lectores de pantalla en navegación base.
- RNF-015: No depender exclusivamente del color para comunicar estados críticos.

---

# 13. Requisitos de contenido

## 13.1 Categorías del MVP

Se recomienda incluir al menos 6 categorías iniciales:

- comida
- animales
- objetos cotidianos
- películas / series
- lugares
- profesiones

## 13.2 Tamaño mínimo de banco de palabras

- Mínimo recomendado: 50 palabras por categoría para MVP.
- Objetivo deseable: 100+ por categoría para reducir repetición.

## 13.3 Reglas editoriales para palabras

- palabras fáciles de entender;
- evitar ambigüedades extremas en MVP;
- evitar términos ofensivos o sensibles;
- mantener consistencia de idioma;
- idealmente usar sustantivos o conceptos ampliamente reconocibles.

---

# 14. Modelo de datos de alto nivel

## 14.1 Entidades principales

### Player

- id
- name
- score
- orderIndex
- isActive

### GameSettings

- playerCount
- roundsTotal
- categoryId
- clueTimerSeconds
- debateTimerSeconds
- finalGuessEnabled

### GameSession

- id
- status
- currentRound
- settings
- players[]
- startedAt
- updatedAt

### Round

- id
- roundNumber
- secretWordId
- impostorPlayerId
- startingPlayerId
- votes[]
- result
- finalGuess

### Vote

- voterPlayerId
- targetPlayerId
- phase (primary / tieBreak)

### Word

- id
- value
- categoryId
- locale
- enabled

### Category

- id
- name
- enabled

---

# 15. Máquina de estados propuesta

## Estados de sesión

- idle
- setup
- player_entry
- role_distribution
- clue_phase
- debate_phase
- voting_phase
- tie_break_voting
- reveal_phase
- final_guess_phase
- scoreboard_phase
- finished

## Recomendación

Centralizar la lógica del juego en una máquina de estados explícita o reducer bien tipado, evitando depender solo de navegación por pantallas.

Beneficios:

- menor complejidad en validaciones;
- menos errores de transición;
- mejor testabilidad.

---

# 16. Arquitectura técnica propuesta

## 16.1 Enfoque recomendado

### Frontend

- React o Next.js
- TypeScript
- gestión de estado centralizada
- routing simple por pantallas o single-flow container

### Persistencia

- localStorage o IndexedDB para sesión local y catálogo estático

### Contenido

- banco de palabras servido como JSON versionado

### Estilo

- sistema de componentes reusable
- diseño mobile-first

## 16.2 Justificación

Para un MVP sin login y sin tiempo real, una arquitectura principalmente frontend con persistencia local reduce complejidad, coste y tiempo de entrega.

## 16.3 Backend en MVP

Opciones:

### Opción A. Sin backend en primera entrega

- La app consume contenido empaquetado localmente.
- No hay telemetría persistente salvo herramientas externas de analytics.

### Opción B. Backend mínimo opcional

- endpoint para servir catálogo de palabras y configuración remota;
- endpoint para telemetría básica;
- feature flags.

## Recomendación

Empezar con **frontend-first** y backend mínimo solo si producto necesita analítica o actualización dinámica de contenido antes del lanzamiento.

---

# 17. Seguridad y privacidad

## Alcance realista del MVP

No existe seguridad fuerte contra “jugadores malintencionados” en un modo pass-and-play local. El objetivo es prevenir **exposición accidental**, no abuso intencional.

## Requisitos mínimos

- no registrar roles en UI visible;
- limpiar pantalla entre jugadores;
- no exponer palabra en notificaciones del navegador;
- no mostrar datos sensibles en títulos de pestaña o previews compartibles.

---

# 18. Telemetría recomendada

## Eventos de analítica

- app_opened
- new_game_started
- setup_completed
- round_started
- round_completed
- game_completed
- resumed_game
- abandoned_at_screen
- category_selected
- timer_enabled

## Propiedades útiles

- player_count
- rounds_total
- category
- current_screen
- session_duration
- round_duration

## Objetivo

Entender dónde hay fricción y qué configuraciones se usan más.

---

# 19. Criterios de aceptación del MVP a nivel producto

El MVP se considerará listo cuando:

1. un grupo de 3 a 10 personas pueda completar una partida entera sin ayuda externa;
2. la app permita jugar varias rondas consecutivas sin reconfiguración completa;
3. la asignación de roles y la votación sean privadas a nivel de UX;
4. el sistema compute correctamente empates, resolución y puntuación;
5. la sesión pueda recuperarse tras una recarga accidental razonable;
6. la experiencia móvil sea clara, estable y rápida.

---

# 20. QA: casos mínimos a cubrir

## Flujo feliz

- crear partida válida;
- introducir jugadores;
- repartir roles;
- completar pistas;
- votar;
- resolver ronda;
- sumar puntos;
- pasar a siguiente ronda;
- finalizar partida.

## Casos límite

- 3 jugadores;
- 10 jugadores;
- nombres duplicados;
- recarga durante reparto;
- recarga durante votación;
- empate en primera votación;
- empate persistente;
- impostor detectado con adivinanza activada;
- impostor detectado con adivinanza desactivada;
- temporizadores activados y desactivados.

## Casos de validación

- impedir menos de 3 jugadores;
- impedir votos a uno mismo;
- impedir avanzar con nombres vacíos;
- asegurar que siempre se asigna exactamente 1 impostor.

---

# 21. Riesgos del MVP

## Riesgo 1. Fricción en pass-and-play

Si el reparto es lento o confuso, la experiencia cae.

**Mitigación:** pantallas muy simples, CTA únicos y transiciones rápidas.

## Riesgo 2. Banco de palabras pobre

Si las palabras se repiten o son malas, baja la rejugabilidad.

**Mitigación:** priorizar calidad editorial y volumen mínimo razonable.

## Riesgo 3. Complejidad innecesaria en lógica de estados

Los empates y fases extra pueden introducir bugs.

**Mitigación:** máquina de estados clara y tests de lógica.

## Riesgo 4. Mala experiencia en móvil

Si la UI no está optimizada para pulgar y pantallas pequeñas, el producto falla.

**Mitigación:** diseño mobile-first desde el inicio.

---

# 22. Roadmap posterior sugerido

## Post-MVP inmediato

- packs personalizados;
- categorías múltiples por partida;
- mejoras visuales y animaciones;
- mejores resúmenes de fin de partida.

## Siguiente fase

- modo multi-dispositivo local por código o QR;
- perfiles opcionales;
- historial de partidas.

## Fase avanzada

- juego remoto en tiempo real;
- roles avanzados;
- catálogo editorial remoto;
- social layer.

---

# 23. Decisiones abiertas para refinamiento con PO

1. ¿La comparación de la adivinanza final será exacta o tolerante?
2. ¿Se permitirá elegir más de una categoría por partida?
3. ¿El marcador final mostrará un ganador único o empate compartido?
4. ¿Se quiere persistencia total de la partida o solo reanudación básica?
5. ¿Habrá sonido y vibración en MVP o se posponen?
6. ¿Se incluirá telemetría desde el primer release?

---

# 24. Recomendación final de implementación

Para maximizar probabilidad de éxito, el desarrollo del MVP debe priorizar en este orden:

1. **Lógica de juego estable**
2. **Flujo pass-and-play impecable**
3. **UI mobile-first clara**
4. **Banco de palabras sólido**
5. **Persistencia local y QA de casos borde**

La calidad percibida del producto dependerá mucho más de la fluidez del flujo y de la claridad de las transiciones que de la sofisticación visual.

---

# 25. Anexo: definición corta del MVP

El MVP es una app web responsive para jugar localmente al impostor de palabras en un solo dispositivo, con configuración simple, reparto privado de roles, turnos guiados, votación secreta, resolución automática y marcador por rondas.
