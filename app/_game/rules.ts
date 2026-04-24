import { getEnabledWords } from "@/app/_content/words";
import { pickAvatarIds } from "@/app/_game/avatars";
import type {
  FinalGuess,
  GameSettings,
  Player,
  Round,
  RoundResult,
  Vote,
  VotePhase,
  Word,
} from "@/app/_game/types";

export const defaultSettings: GameSettings = {
  playerCount: 4,
  roundsTotal: 5,
  categoryId: "comida",
  wordMode: "random",
  manualSecretWord: "",
  clueTimerSeconds: null,
  debateTimerSeconds: null,
  finalGuessEnabled: true,
};

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlayers(count: number): Player[] {
  const assignedAvatarIds = pickAvatarIds(count);

  return Array.from({ length: count }, (_, index) => ({
    id: createId("player"),
    name: "",
    score: 0,
    orderIndex: index,
    isActive: true,
    avatarId: assignedAvatarIds[index]!,
  }));
}

export function resizePlayers(players: Player[], count: number): Player[] {
  const keptPlayers = players.slice(0, count).map((player, index) => ({
    ...player,
    orderIndex: index,
    isActive: true,
  }));

  if (keptPlayers.length >= count) {
    return keptPlayers;
  }

  const assignedAvatarIds = pickAvatarIds(
    count - keptPlayers.length,
    keptPlayers.map((player) => player.avatarId),
  );

  return [
    ...keptPlayers,
    ...Array.from({ length: count - keptPlayers.length }, (_, index) => {
      const orderIndex = keptPlayers.length + index;
      return {
        id: createId("player"),
        name: "",
        score: 0,
        orderIndex,
        isActive: true,
        avatarId: assignedAvatarIds[index]!,
      };
    }),
  ];
}

export function normalizeGuess(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

export function sanitizeManualSecretWord(value: string) {
  return value.trim();
}

export function hasValidManualSecretWord(settings: GameSettings) {
  return sanitizeManualSecretWord(settings.manualSecretWord).length > 0;
}

export function isFinalGuessCorrect(guess: string, secretWord: string) {
  return normalizeGuess(guess) === normalizeGuess(secretWord);
}

export function rotatePlayerIds(players: Player[], startOffset: number) {
  const ordered = [...players]
    .filter((player) => player.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const normalizedOffset = ordered.length === 0 ? 0 : startOffset % ordered.length;

  return [
    ...ordered.slice(normalizedOffset),
    ...ordered.slice(0, normalizedOffset),
  ].map((player) => player.id);
}

export function selectRandomItem<T>(items: T[], random = Math.random): T {
  if (items.length === 0) {
    throw new Error("Cannot select from an empty list");
  }

  return items[Math.floor(random() * items.length)];
}

export function selectRoundWord(categoryId: string, random = Math.random): Word {
  return selectRandomItem(getEnabledWords(categoryId), random);
}

export function createRound(
  roundNumber: number,
  players: Player[],
  settings: GameSettings,
  random = Math.random,
): Round {
  const sanitizedManualWord = sanitizeManualSecretWord(settings.manualSecretWord);
  const word =
    settings.wordMode === "manual" && sanitizedManualWord
      ? {
          id: `manual:${normalizeGuess(sanitizedManualWord)}`,
          value: sanitizedManualWord,
          categoryId: settings.categoryId,
          locale: "es" as const,
          enabled: true,
        }
      : selectRoundWord(settings.categoryId, random);
  const impostor = selectRandomItem(players.filter((player) => player.isActive), random);
  const turnOrderPlayerIds = rotatePlayerIds(players, roundNumber - 1);

  return {
    id: createId("round"),
    roundNumber,
    secretWordId: word.id,
    secretWordValue: word.value,
    categoryId: settings.categoryId,
    impostorPlayerId: impostor.id,
    startingPlayerId: turnOrderPlayerIds[0] ?? impostor.id,
    turnOrderPlayerIds,
    votes: [],
    result: null,
    finalGuess: null,
  };
}

export function getVoteCandidates(
  players: Player[],
  voterPlayerId: string,
  tiedCandidateIds: string[] = [],
) {
  const candidateIds = tiedCandidateIds.length > 0 ? tiedCandidateIds : players.map((player) => player.id);
  return players.filter(
    (player) =>
      player.isActive &&
      player.id !== voterPlayerId &&
      candidateIds.includes(player.id),
  );
}

export function countVotes(votes: Vote[], phase: VotePhase) {
  return votes
    .filter((vote) => vote.phase === phase)
    .reduce<Record<string, number>>((acc, vote) => {
      acc[vote.targetPlayerId] = (acc[vote.targetPlayerId] ?? 0) + 1;
      return acc;
    }, {});
}

export function getTopVotedPlayerIds(votes: Vote[], phase: VotePhase) {
  const counts = countVotes(votes, phase);
  const maxVotes = Math.max(0, ...Object.values(counts));

  if (maxVotes === 0) {
    return [];
  }

  return Object.entries(counts)
    .filter(([, count]) => count === maxVotes)
    .map(([playerId]) => playerId);
}

export function resolveVotes(round: Round, phase: VotePhase): RoundResult | { tie: string[] } {
  const topPlayerIds = getTopVotedPlayerIds(round.votes, phase);

  if (topPlayerIds.length !== 1) {
    if (phase === "tieBreak") {
      return {
        outcome: "impostor_survived",
        impostorWon: true,
        expelledPlayerId: null,
        tiedPlayerIds: topPlayerIds,
        finalGuessCorrect: null,
        scoreApplied: false,
      };
    }

    return { tie: topPlayerIds };
  }

  const expelledPlayerId = topPlayerIds[0] ?? null;
  const impostorDetected = expelledPlayerId === round.impostorPlayerId;

  return {
    outcome: impostorDetected ? "impostor_detected" : "impostor_survived",
    impostorWon: !impostorDetected,
    expelledPlayerId,
    tiedPlayerIds: [],
    finalGuessCorrect: null,
    scoreApplied: false,
  };
}

export function applyFinalGuess(result: RoundResult, guess: FinalGuess): RoundResult {
  return {
    ...result,
    outcome: guess.correct
      ? "impostor_detected_and_guessed"
      : "impostor_detected_and_failed",
    impostorWon: guess.correct,
    finalGuessCorrect: guess.correct,
  };
}

export function applyScore(players: Player[], round: Round): Player[] {
  if (!round.result || round.result.scoreApplied) {
    return players;
  }

  return players.map((player) => {
    if (!player.isActive) {
      return player;
    }

    if (round.result?.outcome === "impostor_survived") {
      return player.id === round.impostorPlayerId
        ? { ...player, score: player.score + 3 }
        : player;
    }

    if (round.result?.outcome === "impostor_detected_and_guessed") {
      return { ...player, score: player.score + 1 };
    }

    if (
      round.result?.outcome === "impostor_detected" ||
      round.result?.outcome === "impostor_detected_and_failed"
    ) {
      return player.id === round.impostorPlayerId
        ? player
        : { ...player, score: player.score + 2 };
    }

    return player;
  });
}

export function resetRoundScopedSettings(settings: GameSettings): GameSettings {
  if (settings.wordMode !== "manual") {
    return settings;
  }

  return {
    ...settings,
    wordMode: "random",
    manualSecretWord: "",
  };
}

export function markScoreApplied(round: Round): Round {
  if (!round.result) {
    return round;
  }

  return {
    ...round,
    result: {
      ...round.result,
      scoreApplied: true,
    },
  };
}

export function hasEmptyNames(players: Player[]) {
  return players.some((player) => player.name.trim().length === 0);
}

export function hasDuplicateNames(players: Player[]) {
  const names = players.map((player) => normalizeGuess(player.name)).filter(Boolean);
  return new Set(names).size !== names.length;
}
