# Impostor de palabras

App web local para jugar partidas presenciales de "impostor de palabras" en modo pass-and-play con un solo dispositivo. El producto está en español y el foco actual es un MVP jugable, simple de arrancar y fácil de mantener.

## Estado del proyecto

El repositorio implementa una versión MVP funcional con:

- juego local en un único dispositivo;
- entre 3 y 10 jugadores;
- 1 impostor por ronda;
- categorías predefinidas;
- varias rondas con marcador acumulado;
- persistencia local de la sesión activa;
- tests de dominio y UI con Vitest.

No incluye multijugador online, cuentas, salas, roles avanzados ni creación de contenido por usuarios.

## Reglas soportadas en el MVP

En cada ronda:

1. Todos los jugadores salvo uno reciben la palabra secreta.
2. El jugador que no la recibe es el impostor.
3. La app reparte roles de forma privada pasando el dispositivo.
4. Cada persona da una pista en voz alta fuera de la app.
5. El grupo debate fuera de la app.
6. La votación se hace en secreto dentro de la app.
7. Si hay empate, se hace una segunda votación entre empatados.
8. Si el empate persiste, el impostor gana la ronda.
9. Si el impostor es detectado y la regla está activa, puede intentar adivinar la palabra.
10. Se actualiza el marcador y comienza la siguiente ronda.

## Stack y requisitos locales

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Vitest + Testing Library
- Node.js 20 o superior recomendado
- `npm` para instalación y ejecución

## Desarrollo y validación

Instalación:

```bash
npm install
```

Servidor local:

```bash
npm run dev
```

Checks disponibles:

```bash
npm test
npm run lint
npm run build
```

La app arranca en `http://localhost:3000`.

## Arquitectura a alto nivel

La app está organizada alrededor del flujo de una partida local.

- La UI y la orquestación de pantallas viven en `GameShell`, que decide qué fase mostrar según el estado de la sesión.
- El estado principal de juego se gestiona con un reducer y una máquina de estados explícita para fases como configuración, reparto, pistas, debate, votación, resolución, adivinanza final y marcador.
- Las reglas puras del dominio viven separadas de la UI: creación de rondas, asignación de impostor, orden de turnos, resolución de votos y puntuación.
- El catálogo de contenido contiene categorías y palabras predefinidas para el MVP.
- La persistencia local guarda la sesión activa y permite reanudarla al volver a abrir la app.

## Flujo de estado de la partida

El flujo principal implementado hoy es:

1. Inicio.
2. Configuración de partida.
3. Alta de jugadores.
4. Reparto privado de roles.
5. Fase de pistas.
6. Debate.
7. Votación secreta.
8. Resolución de ronda.
9. Adivinanza final del impostor, si aplica.
10. Marcador.
11. Siguiente ronda o fin de partida.

Este flujo está modelado como estados explícitos en el dominio, no como navegación libre entre pantallas.

## Persistencia local

- La sesión activa se guarda en `localStorage`.
- Solo se persisten partidas activas; una sesión `idle` o `finished` se elimina.
- Al abrir la app, si existe una sesión válida, se ofrece continuar partida.
- La carga de sesión intenta reparar avatares ausentes de sesiones antiguas antes de devolver el estado a la UI.

Esto permite continuidad básica sin backend ni autenticación.

## Calidad y testing

El repositorio incluye validación automática para la lógica principal del juego y partes críticas de la UI.

- Tests de dominio para reglas, reducer, votos, puntuación, persistencia y avatares.
- Tests de componentes para flujos clave como reparto de roles y pantallas base.
- `eslint` para validación estática.
- `next build` como verificación final de tipos y producción.

Antes de fusionar cambios conviene ejecutar:

```bash
npm test
npm run lint
npm run build
```

## Documentación relacionada

- Documento funcional y de alcance del MVP: [docs/mvp-definition.md](/Users/jmoreno/xesmona/projects/xesmona-imposter-game/docs/mvp-definition.md)

Ese documento describe producto y alcance con más detalle. Este README está pensado como punto de entrada técnico y operativo para el repositorio.

## Limitaciones actuales y fuera de alcance

Limitaciones conocidas del MVP:

- producto solo en español;
- una única experiencia local pass-and-play;
- contenido estático embebido en el repositorio;
- analítica definida como punto de integración, pero sin proveedor real conectado;
- persistencia local simple, sin sincronización entre dispositivos.

Fuera de alcance en esta iteración:

- multijugador online;
- login y cuentas;
- salas o códigos de invitación;
- panel editorial;
- roles adicionales;
- internacionalización completa.
