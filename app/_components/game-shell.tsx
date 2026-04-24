"use client";

import { useEffect, useReducer, useState } from "react";
import { categories } from "@/app/_content/words";
import {
  Banner,
  Button,
  Card,
  Field,
  getPlayerStyle,
  PlayerChip,
  RevealPanel,
  RoleBadge,
  Screen,
  Select,
  TextInput,
} from "@/app/_components/ui";
import { trackEvent } from "@/app/_game/analytics";
import { getPlayerRole, getRoleMeta } from "@/app/_game/roles";
import { createInitialSession, gameReducer } from "@/app/_game/reducer";
import { getVoteCandidates, hasDuplicateNames } from "@/app/_game/rules";
import { clearSession, loadSession, saveSession } from "@/app/_game/storage";
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

function playerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function useTimer(seconds: number | null, resetKey: string) {
  const [timerState, setTimerState] = useState({
    key: resetKey,
    remaining: seconds ?? 0,
  });
  const remaining = timerState.key === resetKey ? timerState.remaining : seconds ?? 0;

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

function PlayerAvatar({
  player,
  size = "md",
  muted = false,
}: {
  player: Player;
  size?: "sm" | "md";
  muted?: boolean;
}) {
  const sizes = {
    sm: "h-11 w-11 text-sm",
    md: "h-14 w-14 text-base",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-[color:var(--player-accent-strong)] bg-[color:var(--player-accent)] font-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.14)] ${sizes[size]} ${muted ? "grayscale opacity-45" : ""}`}
      style={getPlayerStyle(player.orderIndex)}
    >
      {playerInitials(player.name)}
    </div>
  );
}

function Timer({
  seconds,
  resetKey,
  tone = "default",
}: {
  seconds: number | null;
  resetKey: string;
  tone?: "default" | "private";
}) {
  const remaining = useTimer(seconds, resetKey);
  const progress = seconds ? Math.max(0, remaining / seconds) : 0;

  if (!seconds) {
    return (
      <Card className="bg-white/82">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--color-text-secondary)]">
          Ritmo
        </p>
        <p className="mt-2 text-lg font-black text-[color:var(--color-text-primary)]">
          Avance manual, sin temporizador.
        </p>
      </Card>
    );
  }

  const wrapperClass =
    tone === "private"
      ? "border-[color:rgba(255,250,244,0.12)] bg-white/8 text-[color:var(--color-text-inverse)]"
      : "border-[color:var(--color-border)] bg-white/82 text-[color:var(--color-text-primary)]";
  const labelClass =
    tone === "private"
      ? "text-[color:rgba(255,250,244,0.7)]"
      : "text-[color:var(--color-text-secondary)]";

  return (
    <div className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-soft)] ${wrapperClass}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.24em] ${labelClass}`}>Tiempo</p>
          <p className="mt-2 text-5xl font-black tabular-nums tracking-[-0.06em]">{remaining}s</p>
        </div>
        <p className={`max-w-28 text-right text-sm font-semibold ${labelClass}`}>
          {remaining === 0 ? "Tiempo agotado." : "Ritmo suave para no romper el flujo."}
        </p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-action-primary),var(--color-action-primary-soft))] transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function ScoreTable({ players }: { players: Player[] }) {
  return (
    <div className="grid gap-3">
      {orderedPlayers(players)
        .sort((a, b) => b.score - a.score || a.orderIndex - b.orderIndex)
        .map((player, index) => (
          <div
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/86 p-4 shadow-[var(--shadow-soft)]"
            key={player.id}
            style={getPlayerStyle(player.orderIndex)}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-black text-[color:var(--color-text-secondary)]">
                {index + 1}.
              </span>
              <PlayerAvatar player={player} size="sm" />
              <div>
                <p className="font-black text-[color:var(--color-text-primary)]">{player.name}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--player-accent-strong)]">
                  Jugador
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[color:var(--player-accent)] bg-[color:var(--player-accent-soft)] px-3 py-1 text-sm font-black text-[color:var(--color-text-primary)]">
              {player.score} pts
            </span>
          </div>
        ))}
    </div>
  );
}

function VoteOption({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Player;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border-2 p-4 transition-all duration-[var(--motion-fast)] ease-out ${
        selected
          ? "border-[color:var(--player-accent-strong)] bg-[color:var(--player-accent-soft)] shadow-[0_14px_24px_rgba(0,0,0,0.16)]"
          : "border-[color:rgba(255,250,244,0.12)] bg-white/8 hover:bg-white/12"
      }`}
      style={getPlayerStyle(candidate.orderIndex)}
    >
      <PlayerAvatar player={candidate} muted={false} />
      <div className="flex-1">
        <p className="text-lg font-black text-white">{candidate.name}</p>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">
          {selected ? "Seleccionado" : "Toca una vez para votar"}
        </p>
      </div>
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[color:var(--player-accent-strong)] bg-[color:var(--player-accent)] text-white"
            : "border-white/35 bg-transparent text-transparent"
        }`}
      >
        ✓
      </span>
      <input
        checked={selected}
        className="sr-only"
        name="vote"
        onChange={onSelect}
        type="radio"
      />
    </label>
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
            <h2 className="text-[length:var(--text-title)] font-black tracking-[-0.04em] [font-family:var(--font-display)]">
              Reglas rápidas
            </h2>
            <p className="mt-2 font-semibold leading-7 text-[color:var(--color-text-secondary)]">
              Todos reciben la misma palabra excepto una persona: el impostor. Cada jugador da una pista verbal, el grupo debate y despues vota en secreto. Si el impostor sobrevive suma 3 puntos; si lo descubren, puede intentar adivinar la palabra si la regla esta activa.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-white/86">
              <p className="text-3xl font-black tracking-[-0.05em] [font-family:var(--font-display)]">3-10</p>
              <p className="text-sm font-bold text-[color:var(--color-text-secondary)]">jugadores</p>
            </Card>
            <Card className="bg-white/86">
              <p className="text-3xl font-black tracking-[-0.05em] [font-family:var(--font-display)]">1</p>
              <p className="text-sm font-bold text-[color:var(--color-text-secondary)]">impostor</p>
            </Card>
            <Card className="bg-white/86">
              <p className="text-3xl font-black tracking-[-0.05em] [font-family:var(--font-display)]">local</p>
              <p className="text-sm font-bold text-[color:var(--color-text-secondary)]">sin cuentas</p>
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
        footer={<Button onClick={() => dispatch({ type: "GO_TO_PLAYER_ENTRY" })}>Continuar</Button>}
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
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/72 p-4 shadow-[var(--shadow-soft)]">
          <span>
            <span className="block text-sm font-black text-[color:var(--color-text-primary)]">
              Adivinanza final
            </span>
            <span className="block text-sm font-semibold text-[color:var(--color-text-secondary)]">
              Si descubren al impostor, puede intentar adivinar la palabra.
            </span>
          </span>
          <input
            checked={session.settings.finalGuessEnabled}
            className="h-7 w-7 accent-[color:var(--color-action-primary)]"
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
        description="Estos nombres se usaran para turnos, votos y marcador. Los colores ayudan a reconocerlos más rapido en cada ronda."
        footer={
          <>
            {duplicateNames ? (
              <Banner>Hay nombres repetidos. Puedes continuar, pero conviene diferenciarlos.</Banner>
            ) : null}
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
            <div key={player.id} style={getPlayerStyle(player.orderIndex)}>
              <Field label={`Jugador ${index + 1}`} hint="Este color se mantiene durante toda la partida.">
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={player} size="sm" />
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
                </div>
              </Field>
            </div>
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
    const roleId = player ? getPlayerRole(player.id, session.currentRound) : "citizen";
    const roleMeta = getRoleMeta(roleId);
    const isImpostor = roleId === "impostor";
    const roleKey = `${session.currentRound.id}-${session.roleDistributionIndex}`;
    const roleVisible = roleReveal.key === roleKey && roleReveal.visible;
    const hasRevealedAnyRole = session.roleDistributionIndex > 0 || roleReveal.visible;

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
        {player ? (
          <div className="mb-1">
            <PlayerChip
              emphasis="current"
              name={player.name}
              orderIndex={player.orderIndex}
              suffix={roleVisible ? "activo" : "en privado"}
            />
          </div>
        ) : null}
        {roleVisible ? (
          <div
            className={`flex flex-1 items-center justify-center rounded-[calc(var(--radius-xl)+2px)] border px-6 py-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${
              isImpostor
                ? "border-[#86525a] bg-[radial-gradient(circle_at_50%_0%,rgba(216,76,76,0.35),transparent_18rem),linear-gradient(180deg,rgba(58,22,28,0.98),rgba(29,14,20,0.98))] text-[color:var(--color-text-inverse)]"
                : "border-[color:rgba(255,250,244,0.14)] bg-[radial-gradient(circle_at_50%_0%,rgba(229,154,46,0.18),transparent_18rem),linear-gradient(180deg,rgba(31,27,41,0.98),rgba(20,17,28,0.98))] text-[color:var(--color-text-inverse)]"
            }`}
          >
            <div className="max-w-sm">
              <p className="text-[length:var(--text-label)] font-black uppercase tracking-[0.28em] text-[color:var(--color-action-primary-soft)]">
                Rol secreto
              </p>
              <RoleBadge className="mt-5" roleId={roleId} />
              <p className="mt-5 text-balance text-5xl font-black tracking-[-0.07em] [font-family:var(--font-display)] sm:text-6xl">
                {isImpostor ? "No recibes palabra" : session.currentRound.secretWordValue}
              </p>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/78 sm:text-base">
                {isImpostor
                  ? roleMeta.description
                  : "Memoriza la palabra secreta, mantén el rol en privado y pulsa ocultar antes de pasar el móvil."}
              </p>
            </div>
          </div>
        ) : (
          <RevealPanel
            description="Pulsa solo cuando tengas el dispositivo en tus manos."
            eyebrow="Pantalla privada"
            title="Pantalla oculta"
          />
        )}
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
        {player ? (
          <Card className="bg-white/88">
            <div className="flex items-center gap-4">
              <PlayerAvatar player={player} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--color-text-secondary)]">
                  Turno actual
                </p>
                <p className="mt-1 text-[length:var(--text-title)] font-black tracking-[-0.04em] [font-family:var(--font-display)]">
                  {player.name}
                </p>
              </div>
            </div>
          </Card>
        ) : null}
        <Timer
          resetKey={`${session.currentRound.id}-${session.clueTurnIndex}`}
          seconds={session.settings.clueTimerSeconds}
        />
        <Card className="bg-white/84">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
            Orden de ronda
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.currentRound.turnOrderPlayerIds.map((id, index) => {
              const turnPlayer = getPlayer(session.players, id);
              if (!turnPlayer) {
                return null;
              }

              return (
                <PlayerChip
                  emphasis={index === session.clueTurnIndex ? "current" : "normal"}
                  key={id}
                  name={turnPlayer.name}
                  orderIndex={turnPlayer.orderIndex}
                />
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
        <Banner>
          Una sola acción aquí: debatir y decidir cuándo pasar a la votación secreta.
        </Banner>
      </Screen>
    );
  }

  if (session.status === "voting_phase" || session.status === "tie_break_voting") {
    const voter = orderedPlayers(session.players)[session.voteVoterIndex];
    const candidates = voter ? getVoteCandidates(session.players, voter.id, session.tieCandidateIds) : [];
    const isTieBreak = session.status === "tie_break_voting";
    const voteKey = `${session.status}-${session.voteVoterIndex}`;
    const selectedVoteTarget = voteSelection.key === voteKey ? voteSelection.targetId : "";
    const hasPrimaryVotes = session.currentRound.votes.some((vote) => vote.phase === "primary");

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
        {voter ? (
          <div className="mb-1">
            <PlayerChip
              emphasis="current"
              name={voter.name}
              orderIndex={voter.orderIndex}
              suffix="vota"
            />
          </div>
        ) : null}
        <div className="grid gap-3">
          {candidates.map((candidate) => (
            <VoteOption
              candidate={candidate}
              key={candidate.id}
              onSelect={() => setVoteSelection({ key: voteKey, targetId: candidate.id })}
              selected={selectedVoteTarget === candidate.id}
            />
          ))}
        </div>
        <Banner tone="danger">Tras confirmar, oculta la pantalla antes de pasar el movil.</Banner>
      </Screen>
    );
  }

  if (session.status === "reveal_phase") {
    const result = session.currentRound.result;
    const expelled = getPlayer(session.players, result?.expelledPlayerId);
    const impostor = getPlayer(session.players, session.currentRound.impostorPlayerId);
    const impostorRole = getRoleMeta("impostor");
    const wasDetected = result?.outcome === "impostor_detected";
    const detectedAndResolved =
      result?.outcome === "impostor_detected" ||
      result?.outcome === "impostor_detected_and_guessed" ||
      result?.outcome === "impostor_detected_and_failed";

    return (
      <Screen
        eyebrow="Resolucion"
        title={result?.expelledPlayerId ? `${expelled?.name} fue señalado` : "Sin expulsión"}
        description={
          result?.expelledPlayerId
            ? detectedAndResolved
              ? "El grupo encontró al impostor."
              : "El grupo señaló a una persona inocente."
            : "El empate persistió. El impostor sobrevive esta ronda."
        }
        footer={
          <Button onClick={() => dispatch({ type: "CONTINUE_FROM_REVEAL" })}>
            {wasDetected && session.settings.finalGuessEnabled ? "Adivinanza final" : "Ver marcador"}
          </Button>
        }
        tone="celebration"
      >
        <Card className="bg-white/88">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--color-text-secondary)]">
            Resultado de ronda
          </p>
          <div className="mt-4 grid gap-4">
            <div className="flex items-center gap-3">
              {impostor ? <PlayerAvatar player={impostor} /> : null}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--color-danger)]">
                  Rol revelado
                </p>
                <div className="mt-2">
                  <RoleBadge roleId="impostor" />
                </div>
                <p className="text-[length:var(--text-title)] font-black tracking-[-0.04em] [font-family:var(--font-display)]">
                  {impostor?.name}
                </p>
                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[color:var(--color-text-secondary)]">
                  {impostorRole.description}
                </p>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)]">
                Palabra secreta
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em] [font-family:var(--font-display)]">
                {session.currentRound.secretWordValue}
              </p>
            </div>
          </div>
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
        {impostor ? (
          <div className="mb-1">
            <PlayerChip emphasis="current" name={impostor.name} orderIndex={impostor.orderIndex} />
          </div>
        ) : null}
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
