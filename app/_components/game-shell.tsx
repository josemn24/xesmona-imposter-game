"use client";

import { useEffect, useReducer, useState } from "react";
import { categories } from "@/app/_content/words";
import { Banner, Button, Card, Field, Screen, Select, TextInput } from "@/app/_components/ui";
import { trackEvent } from "@/app/_game/analytics";
import { gameReducer, createInitialSession } from "@/app/_game/reducer";
import {
  getVoteCandidates,
  hasDuplicateNames,
} from "@/app/_game/rules";
import {
  clearSession,
  loadSession,
  saveSession,
} from "@/app/_game/storage";
import type { GameAction, GameSession, Player } from "@/app/_game/types";

const clueTimerOptions = [
  { label: "Sin temporizador", value: "0" },
  { label: "10 segundos", value: "10" },
  { label: "15 segundos", value: "15" },
  { label: "20 segundos", value: "20" },
  { label: "30 segundos", value: "30" },
];

const debateTimerOptions = [
  { label: "Sin temporizador", value: "0" },
  { label: "60 segundos", value: "60" },
  { label: "90 segundos", value: "90" },
  { label: "120 segundos", value: "120" },
];

function timerValue(value: string) {
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

function getPlayer(players: Player[], playerId: string | null | undefined) {
  return players.find((player) => player.id === playerId) ?? null;
}

function orderedPlayers(players: Player[]) {
  return [...players].sort((a, b) => a.orderIndex - b.orderIndex);
}

function getLeaders(players: Player[]) {
  const maxScore = Math.max(...players.map((player) => player.score));
  return players.filter((player) => player.score === maxScore);
}

function useTimer(seconds: number | null, resetKey: string) {
  const [timerState, setTimerState] = useState({
    key: resetKey,
    remaining: seconds ?? 0,
  });
  const remaining =
    timerState.key === resetKey ? timerState.remaining : seconds ?? 0;

  useEffect(() => {
    if (!seconds || remaining <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimerState({
        key: resetKey,
        remaining: Math.max(0, remaining - 1),
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [remaining, resetKey, seconds]);

  return remaining;
}

function Timer({ seconds, resetKey }: { seconds: number | null; resetKey: string }) {
  const remaining = useTimer(seconds, resetKey);

  if (!seconds) {
    return <p className="text-sm font-bold text-stone-600">Avance manual, sin temporizador.</p>;
  }

  return (
    <div className="rounded-3xl border-2 border-stone-900 bg-stone-950 p-4 text-white">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Tiempo</p>
      <p className="mt-2 text-5xl font-black tabular-nums tracking-tighter">{remaining}s</p>
      {remaining === 0 ? (
        <p className="mt-2 text-sm font-bold text-amber-100">Tiempo agotado. Podéis avanzar cuando queráis.</p>
      ) : null}
    </div>
  );
}

function ScoreTable({ players }: { players: Player[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-stone-900 bg-white">
      {orderedPlayers(players)
        .sort((a, b) => b.score - a.score || a.orderIndex - b.orderIndex)
        .map((player, index) => (
          <div
            className="flex items-center justify-between border-b-2 border-stone-200 px-4 py-3 last:border-b-0"
            key={player.id}
          >
            <span className="font-black text-stone-950">
              {index + 1}. {player.name}
            </span>
            <span className="rounded-full bg-lime-200 px-3 py-1 text-sm font-black text-stone-950">
              {player.score} pts
            </span>
          </div>
        ))}
    </div>
  );
}

export function GameShell() {
  const [session, dispatchBase] = useReducer(gameReducer, undefined, createInitialSession);
  const [savedSession, setSavedSession] = useState<GameSession | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [roleReveal, setRoleReveal] = useState({ key: "", visible: false });
  const [voteSelection, setVoteSelection] = useState({ key: "", targetId: "" });
  const [finalGuess, setFinalGuess] = useState("");

  function dispatch(action: GameAction) {
    if (action.type === "START_NEW_GAME") {
      clearSession();
      setSavedSession(null);
      trackEvent("new_game_started");
    }

    if (action.type === "RESUME_GAME") {
      trackEvent("resumed_game", { current_screen: action.session.status });
    }

    if (action.type === "GO_TO_PLAYER_ENTRY") {
      trackEvent("setup_completed", {
        player_count: session.settings.playerCount,
        rounds_total: session.settings.roundsTotal,
        category: session.settings.categoryId,
      });
    }

    if (action.type === "BEGIN_ROUND") {
      trackEvent("round_started", { current_screen: session.status });
    }

    if (action.type === "UPDATE_SETTINGS" && action.settings.categoryId) {
      trackEvent("category_selected", { category: action.settings.categoryId });
    }

    if (
      action.type === "UPDATE_SETTINGS" &&
      (action.settings.clueTimerSeconds || action.settings.debateTimerSeconds)
    ) {
      trackEvent("timer_enabled");
    }

    if (action.type === "FINISH_GAME") {
      trackEvent("game_completed");
    }

    dispatchBase(action);
  }

  useEffect(() => {
    trackEvent("app_opened");
    const timeout = window.setTimeout(() => {
      setSavedSession(loadSession());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (session.status === "idle") {
      return;
    }

    saveSession(session);
    if (session.status === "finished") {
      clearSession();
      trackEvent("game_completed");
    }
  }, [session]);

  if (session.status === "idle") {
    return (
      <Screen
        eyebrow="Juego local"
        title="Impostor de palabras"
        description="Configura una partida en menos de un minuto, pasa el movil y descubre quien finge saber la palabra."
        footer={
          <>
            <Button onClick={() => dispatch({ type: "START_NEW_GAME" })}>Nueva partida</Button>
            {savedSession ? (
              <Button
                onClick={() => dispatch({ type: "RESUME_GAME", session: savedSession })}
                variant="secondary"
              >
                Continuar partida
              </Button>
            ) : null}
            <Button onClick={() => setShowHowTo((value) => !value)} variant="ghost">
              Cómo se juega
            </Button>
          </>
        }
      >
        {showHowTo ? (
          <Card>
            <h2 className="text-xl font-black text-stone-950">Reglas rápidas</h2>
            <p className="mt-2 font-semibold leading-7 text-stone-700">
              Todos reciben la misma palabra excepto una persona: el impostor. Cada jugador da una pista verbal, el grupo debate y despues vota en secreto. Si el impostor sobrevive suma 3 puntos; si lo descubren, puede intentar adivinar la palabra si la regla esta activa.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-3xl font-black text-stone-950">3-10</p>
              <p className="text-sm font-bold text-stone-600">jugadores</p>
            </Card>
            <Card>
              <p className="text-3xl font-black text-stone-950">1</p>
              <p className="text-sm font-bold text-stone-600">impostor</p>
            </Card>
            <Card>
              <p className="text-3xl font-black text-stone-950">local</p>
              <p className="text-sm font-bold text-stone-600">sin cuentas</p>
            </Card>
          </div>
        )}
      </Screen>
    );
  }

  if (session.status === "setup") {
    return (
      <Screen
        backAction={{
          label: "Inicio",
          onClick: () => dispatch({ type: "GO_TO_HOME" }),
        }}
        eyebrow="Paso 1"
        title="Configura la partida"
        description="Elige los ajustes base. Podras volver a esta pantalla sin perder lo ya escrito mientras no empiece la ronda."
        footer={
          <Button onClick={() => dispatch({ type: "GO_TO_PLAYER_ENTRY" })}>
            Continuar
          </Button>
        }
      >
        <Field label="Numero de jugadores" hint="Entre 3 y 10 personas.">
          <Select
            value={session.settings.playerCount}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { playerCount: Number(event.target.value) },
              })
            }
          >
            {Array.from({ length: 8 }, (_, index) => index + 3).map((value) => (
              <option key={value} value={value}>
                {value} jugadores
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Categoria">
          <Select
            value={session.settings.categoryId}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { categoryId: event.target.value },
              })
            }
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rondas objetivo">
          <Select
            value={session.settings.roundsTotal}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { roundsTotal: Number(event.target.value) },
              })
            }
          >
            {Array.from({ length: 20 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? "ronda" : "rondas"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Temporizador por pista">
          <Select
            value={session.settings.clueTimerSeconds ?? 0}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { clueTimerSeconds: timerValue(event.target.value) },
              })
            }
          >
            {clueTimerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Temporizador de debate">
          <Select
            value={session.settings.debateTimerSeconds ?? 0}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { debateTimerSeconds: timerValue(event.target.value) },
              })
            }
          >
            {debateTimerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center justify-between gap-4 rounded-3xl border-2 border-stone-200 bg-white/70 p-4">
          <span>
            <span className="block text-sm font-black text-stone-950">Adivinanza final</span>
            <span className="block text-sm font-semibold text-stone-600">Si descubren al impostor, puede intentar adivinar la palabra.</span>
          </span>
          <input
            checked={session.settings.finalGuessEnabled}
            className="h-7 w-7 accent-amber-400"
            onChange={(event) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { finalGuessEnabled: event.target.checked },
              })
            }
            type="checkbox"
          />
        </label>
      </Screen>
    );
  }

  if (session.status === "player_entry") {
    const emptyNames = session.players.some((player) => player.name.trim().length === 0);
    const duplicateNames = hasDuplicateNames(session.players);

    return (
      <Screen
        backAction={{
          label: "Configuración",
          onClick: () => dispatch({ type: "GO_TO_SETUP" }),
        }}
        eyebrow="Paso 2"
        title="Añade jugadores"
        description="Estos nombres se usaran para turnos, votos y marcador. Los duplicados se permiten, pero pueden confundir al votar."
        footer={
          <>
            {duplicateNames ? <Banner>Hay nombres repetidos. Puedes continuar, pero conviene diferenciarlos.</Banner> : null}
            <Button disabled={emptyNames} onClick={() => dispatch({ type: "BEGIN_ROUND" })}>
              Empezar reparto
            </Button>
            <Button onClick={() => dispatch({ type: "AUTOFILL_PLAYERS" })} variant="secondary">
              Autorrellenar nombres
            </Button>
            <Button onClick={() => dispatch({ type: "GO_TO_SETUP" })} variant="ghost">
              Volver a configuracion
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          {orderedPlayers(session.players).map((player, index) => (
            <Field key={player.id} label={`Jugador ${index + 1}`}>
              <TextInput
                maxLength={20}
                onChange={(event) =>
                  dispatch({
                    type: "SET_PLAYER_NAME",
                    playerId: player.id,
                    name: event.target.value,
                  })
                }
                placeholder={`Jugador ${index + 1}`}
                value={player.name}
              />
            </Field>
          ))}
        </div>
      </Screen>
    );
  }

  if (!session.currentRound) {
    return (
      <Screen title="No hay ronda activa" description="Vuelve al inicio para crear una partida nueva.">
        <Button onClick={() => dispatch({ type: "CLEAR_SESSION" })}>Ir al inicio</Button>
      </Screen>
    );
  }

  if (session.status === "role_distribution") {
    const player = orderedPlayers(session.players)[session.roleDistributionIndex];
    const isImpostor = player?.id === session.currentRound.impostorPlayerId;
    const roleKey = `${session.currentRound.id}-${session.roleDistributionIndex}`;
    const roleVisible = roleReveal.key === roleKey && roleReveal.visible;
    const hasRevealedAnyRole =
      session.roleDistributionIndex > 0 || roleReveal.visible;

    return (
      <Screen
        backAction={{
          danger: true,
          label: "Editar jugadores",
          onClick: () => {
            if (
              hasRevealedAnyRole &&
              !window.confirm("Se reiniciará el reparto de roles de esta ronda.")
            ) {
              return;
            }

            dispatch({ type: "ABORT_CURRENT_ROUND_TO_PLAYER_ENTRY" });
          },
        }}
        eyebrow={`Ronda ${session.currentRound.roundNumber}`}
        title={player ? `Turno de ${player.name}` : "Reparto"}
        description="Antes de revelar, aseguraos de que solo esta persona ve la pantalla."
        tone="private"
        footer={
          roleVisible ? (
            <Button onClick={() => dispatch({ type: "NEXT_ROLE" })}>Ocultar y pasar</Button>
          ) : (
            <Button onClick={() => setRoleReveal({ key: roleKey, visible: true })}>Ver mi rol</Button>
          )
        }
      >
        <div className="flex flex-1 items-center justify-center rounded-[2rem] border-2 border-white/20 bg-black/35 p-6 text-center text-white">
          {roleVisible ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-200">
                {isImpostor ? "Rol secreto" : "Palabra secreta"}
              </p>
              <p className="mt-4 text-5xl font-black tracking-tighter">
                {isImpostor ? "Eres el impostor" : session.currentRound.secretWordValue}
              </p>
              <p className="mt-5 text-sm font-bold text-white/75">
                Memoriza esto y pulsa ocultar antes de pasar el movil.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-5xl font-black">Pantalla oculta</p>
              <p className="mt-4 text-white/70">Pulsa solo cuando tengas el dispositivo en tus manos.</p>
            </div>
          )}
        </div>
      </Screen>
    );
  }

  if (session.status === "clue_phase") {
    const playerId = session.currentRound.turnOrderPlayerIds[session.clueTurnIndex];
    const player = getPlayer(session.players, playerId);

    return (
      <Screen
        eyebrow={`Pista ${session.clueTurnIndex + 1}/${session.currentRound.turnOrderPlayerIds.length}`}
        title={player ? `Pista de ${player.name}` : "Fase de pistas"}
        description="La pista se dice en voz alta fuera de la app. No expliques demasiado."
        footer={<Button onClick={() => dispatch({ type: "NEXT_CLUE" })}>Siguiente</Button>}
      >
        <Timer
          resetKey={`${session.currentRound.id}-${session.clueTurnIndex}`}
          seconds={session.settings.clueTimerSeconds}
        />
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-stone-500">Orden de ronda</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.currentRound.turnOrderPlayerIds.map((id, index) => {
              const turnPlayer = getPlayer(session.players, id);
              return (
                <span
                  className={`rounded-full px-3 py-2 text-sm font-black ${
                    index === session.clueTurnIndex
                      ? "bg-amber-300 text-stone-950"
                      : "bg-stone-100 text-stone-600"
                  }`}
                  key={id}
                >
                  {turnPlayer?.name}
                </span>
              );
            })}
          </div>
        </Card>
      </Screen>
    );
  }

  if (session.status === "debate_phase") {
    return (
      <Screen
        backAction={{
          label: "Volver a pistas",
          onClick: () => dispatch({ type: "GO_BACK_TO_CLUES" }),
        }}
        eyebrow="Debate"
        title="Debatid quién es el impostor"
        description="La conversacion ocurre fuera de la app. Cuando el grupo este listo, pasad a votacion secreta."
        footer={<Button onClick={() => dispatch({ type: "START_VOTING" })}>Ir a votacion</Button>}
      >
        <Timer
          resetKey={`${session.currentRound.id}-debate`}
          seconds={session.settings.debateTimerSeconds}
        />
      </Screen>
    );
  }

  if (session.status === "voting_phase" || session.status === "tie_break_voting") {
    const voter = orderedPlayers(session.players)[session.voteVoterIndex];
    const candidates = voter
      ? getVoteCandidates(session.players, voter.id, session.tieCandidateIds)
      : [];
    const isTieBreak = session.status === "tie_break_voting";
    const voteKey = `${session.status}-${session.voteVoterIndex}`;
    const selectedVoteTarget =
      voteSelection.key === voteKey ? voteSelection.targetId : "";
    const hasPrimaryVotes = session.currentRound.votes.some(
      (vote) => vote.phase === "primary",
    );

    return (
      <Screen
        backAction={
          !isTieBreak && !hasPrimaryVotes
            ? {
                label: "Volver al debate",
                onClick: () => dispatch({ type: "GO_BACK_TO_DEBATE" }),
              }
            : undefined
        }
        eyebrow={isTieBreak ? "Desempate secreto" : "Votacion secreta"}
        title={voter ? `Vota ${voter.name}` : "Votacion"}
        description={
          isTieBreak
            ? "Solo se puede votar entre las personas empatadas. El voto sigue siendo secreto."
            : "Elige a quien crees que es el impostor. No se muestran votos parciales."
        }
        tone="private"
        footer={
          <Button
            disabled={!selectedVoteTarget}
            onClick={() => dispatch({ type: "CAST_VOTE", targetPlayerId: selectedVoteTarget })}
          >
            Confirmar voto
          </Button>
        }
      >
        <div className="grid gap-3">
          {candidates.map((candidate) => (
            <label
              className={`flex min-h-14 items-center justify-between rounded-3xl border-2 p-4 font-black ${
                selectedVoteTarget === candidate.id
                  ? "border-amber-300 bg-amber-300 text-stone-950"
                  : "border-stone-300 bg-stone-50 text-stone-950 shadow-[0_4px_0_rgba(28,25,23,0.16)]"
              }`}
              key={candidate.id}
            >
              <span>{candidate.name}</span>
              <input
                checked={selectedVoteTarget === candidate.id}
                className="h-6 w-6 accent-amber-300"
                name="vote"
                onChange={() => setVoteSelection({ key: voteKey, targetId: candidate.id })}
                type="radio"
              />
            </label>
          ))}
        </div>
        <Banner>Tras confirmar, oculta la pantalla antes de pasar el movil.</Banner>
      </Screen>
    );
  }

  if (session.status === "reveal_phase") {
    const result = session.currentRound.result;
    const expelled = getPlayer(session.players, result?.expelledPlayerId);
    const impostor = getPlayer(session.players, session.currentRound.impostorPlayerId);
    const wasDetected = result?.outcome === "impostor_detected";

    return (
      <Screen
        eyebrow="Resolucion"
        title={
          result?.expelledPlayerId
            ? `${expelled?.name} fue señalado`
            : "Sin expulsión"
        }
        description={
          result?.expelledPlayerId
            ? wasDetected
              ? "El grupo encontro al impostor."
              : "El grupo señalo a una persona inocente."
            : "El empate persistio. El impostor sobrevive esta ronda."
        }
        footer={
          <Button onClick={() => dispatch({ type: "CONTINUE_FROM_REVEAL" })}>
            {wasDetected && session.settings.finalGuessEnabled
              ? "Adivinanza final"
              : "Ver marcador"}
          </Button>
        }
      >
        <Card>
          <dl className="grid gap-3">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Impostor</dt>
              <dd className="text-2xl font-black text-stone-950">{impostor?.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Palabra</dt>
              <dd className="text-2xl font-black text-stone-950">{session.currentRound.secretWordValue}</dd>
            </div>
          </dl>
        </Card>
      </Screen>
    );
  }

  if (session.status === "final_guess_phase") {
    const impostor = getPlayer(session.players, session.currentRound.impostorPlayerId);

    return (
      <Screen
        eyebrow="Ultima oportunidad"
        title={`${impostor?.name} intenta adivinar`}
        description="Escribe la palabra exacta. Se compara sin distinguir mayusculas y quitando espacios al inicio y al final."
        footer={
          <Button
            disabled={!finalGuess.trim()}
            onClick={() => {
              dispatch({ type: "SUBMIT_FINAL_GUESS", guess: finalGuess });
              setFinalGuess("");
            }}
          >
            Confirmar adivinanza
          </Button>
        }
      >
        <Field label="Adivinanza del impostor">
          <TextInput
            autoFocus
            onChange={(event) => setFinalGuess(event.target.value)}
            placeholder="Escribe la palabra"
            value={finalGuess}
          />
        </Field>
      </Screen>
    );
  }

  if (session.status === "scoreboard_phase") {
    return (
      <Screen
        eyebrow={`Ronda ${session.currentRound.roundNumber}/${session.settings.roundsTotal}`}
        title="Marcador"
        description="Puntuacion acumulada. La siguiente ronda mantiene jugadores y configuracion, rotando el primer turno."
        tone="celebration"
        footer={
          <>
            <Button onClick={() => dispatch({ type: "NEXT_ROUND" })}>Siguiente ronda</Button>
            <Button onClick={() => dispatch({ type: "FINISH_GAME" })} variant="secondary">
              Finalizar partida
            </Button>
          </>
        }
      >
        <ScoreTable players={session.players} />
      </Screen>
    );
  }

  const leaders = getLeaders(session.players);

  return (
    <Screen
      eyebrow="Fin de partida"
      title={leaders.length === 1 ? `Gana ${leaders[0]?.name}` : "Ganadores compartidos"}
      description={
        leaders.length === 1
          ? "Partida completada. Estos son los puntos finales."
          : `Empate entre ${leaders.map((leader) => leader.name).join(", ")}.`
      }
      tone="celebration"
      footer={<Button onClick={() => dispatch({ type: "START_NEW_GAME" })}>Nueva partida</Button>}
    >
      <ScoreTable players={session.players} />
    </Screen>
  );
}
