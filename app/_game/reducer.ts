import {
  applyFinalGuess,
  applyScore,
  createPlayers,
  createRound,
  defaultSettings,
  hasValidManualSecretWord,
  hasEmptyNames,
  isFinalGuessCorrect,
  markScoreApplied,
  resetRoundScopedSettings,
  resizePlayers,
  resolveVotes,
} from "@/app/_game/rules";
import type { GameAction, GameSession, VotePhase } from "@/app/_game/types";

function now() {
  return new Date().toISOString();
}

export function createInitialSession(): GameSession {
  return {
    id: "local-draft",
    status: "idle",
    settings: defaultSettings,
    players: createPlayers(defaultSettings.playerCount),
    currentRound: null,
    completedRounds: [],
    currentRoundNumber: 0,
    roleDistributionIndex: 0,
    clueTurnIndex: 0,
    voteVoterIndex: 0,
    tieCandidateIds: [],
    startedAt: null,
    updatedAt: now(),
  };
}

function touch(session: GameSession): GameSession {
  return { ...session, updatedAt: now() };
}

function scoreRound(session: GameSession): GameSession {
  if (!session.currentRound?.result) {
    return session;
  }

  const scoredPlayers = applyScore(session.players, session.currentRound);
  const scoredRound = markScoreApplied(session.currentRound);
  const isFinished = scoredRound.roundNumber >= session.settings.roundsTotal;

  return touch({
    ...session,
    status: isFinished ? "finished" : "scoreboard_phase",
    players: scoredPlayers,
    currentRound: scoredRound,
    completedRounds: [...session.completedRounds, scoredRound],
  });
}

function finishVoting(session: GameSession, phase: VotePhase): GameSession {
  if (!session.currentRound) {
    return session;
  }

  const resolution = resolveVotes(session.currentRound, phase);

  if ("tie" in resolution) {
    return touch({
      ...session,
      status: "tie_break_voting",
      voteVoterIndex: 0,
      tieCandidateIds: resolution.tie,
    });
  }

  return touch({
    ...session,
    status: "reveal_phase",
    currentRound: {
      ...session.currentRound,
      result: resolution,
    },
    voteVoterIndex: 0,
    tieCandidateIds: [],
  });
}

export function gameReducer(session: GameSession, action: GameAction): GameSession {
  switch (action.type) {
    case "START_NEW_GAME":
      return touch({
        ...createInitialSession(),
        id: `session-${Date.now()}`,
        status: "setup",
        startedAt: now(),
      });

    case "RESUME_GAME":
      return touch(action.session);

    case "CLEAR_SESSION":
      return createInitialSession();

    case "UPDATE_SETTINGS": {
      const nextSettings = {
        ...session.settings,
        ...action.settings,
      };
      const nextPlayers =
        action.settings.playerCount === undefined
          ? session.players
          : resizePlayers(session.players, nextSettings.playerCount);

      return touch({
        ...session,
        settings: nextSettings,
        players: nextPlayers,
      });
    }

    case "GO_TO_HOME":
      return createInitialSession();

    case "GO_TO_SETUP":
      return touch({ ...session, status: "setup" });

    case "GO_TO_PLAYER_ENTRY":
      return touch({ ...session, status: "player_entry" });

    case "ABORT_CURRENT_ROUND_TO_PLAYER_ENTRY":
      if (!session.currentRound || session.status !== "role_distribution") {
        return session;
      }

      return touch({
        ...session,
        status: "player_entry",
        currentRound: null,
        currentRoundNumber: Math.max(0, session.currentRoundNumber - 1),
        roleDistributionIndex: 0,
        clueTurnIndex: 0,
        voteVoterIndex: 0,
        tieCandidateIds: [],
      });

    case "GO_BACK_TO_CLUES":
      if (!session.currentRound || session.status !== "debate_phase") {
        return session;
      }

      return touch({
        ...session,
        status: "clue_phase",
        clueTurnIndex: Math.max(0, session.currentRound.turnOrderPlayerIds.length - 1),
      });

    case "GO_BACK_TO_DEBATE":
      if (
        !session.currentRound ||
        session.status !== "voting_phase" ||
        session.currentRound.votes.some((vote) => vote.phase === "primary")
      ) {
        return session;
      }

      return touch({
        ...session,
        status: "debate_phase",
        voteVoterIndex: 0,
        tieCandidateIds: [],
      });

    case "SET_PLAYER_NAME":
      return touch({
        ...session,
        players: session.players.map((player) =>
          player.id === action.playerId
            ? { ...player, name: action.name.slice(0, 20) }
            : player,
        ),
      });

    case "AUTOFILL_PLAYERS":
      return touch({
        ...session,
        players: session.players.map((player, index) => ({
          ...player,
          name: player.name.trim() || `Jugador ${index + 1}`,
        })),
      });

    case "BEGIN_ROUND": {
      if (
        hasEmptyNames(session.players) ||
        (session.settings.wordMode === "manual" && !hasValidManualSecretWord(session.settings))
      ) {
        return session;
      }

      const nextRoundNumber = session.currentRoundNumber + 1;
      const round = createRound(nextRoundNumber, session.players, session.settings);

      return touch({
        ...session,
        status: "role_distribution",
        settings: resetRoundScopedSettings(session.settings),
        currentRound: round,
        currentRoundNumber: nextRoundNumber,
        roleDistributionIndex: 0,
        clueTurnIndex: 0,
        voteVoterIndex: 0,
        tieCandidateIds: [],
      });
    }

    case "NEXT_ROLE": {
      const nextIndex = session.roleDistributionIndex + 1;

      if (nextIndex >= session.players.length) {
        return touch({
          ...session,
          status: "clue_phase",
          roleDistributionIndex: 0,
        });
      }

      return touch({ ...session, roleDistributionIndex: nextIndex });
    }

    case "NEXT_CLUE": {
      if (!session.currentRound) {
        return session;
      }

      const nextIndex = session.clueTurnIndex + 1;

      if (nextIndex >= session.currentRound.turnOrderPlayerIds.length) {
        return touch({ ...session, status: "debate_phase", clueTurnIndex: 0 });
      }

      return touch({ ...session, clueTurnIndex: nextIndex });
    }

    case "START_DEBATE":
      return touch({ ...session, status: "debate_phase" });

    case "START_VOTING":
      return touch({
        ...session,
        status: "voting_phase",
        voteVoterIndex: 0,
        tieCandidateIds: [],
      });

    case "CAST_VOTE": {
      if (!session.currentRound) {
        return session;
      }

      const phase: VotePhase =
        session.status === "tie_break_voting" ? "tieBreak" : "primary";
      const voter = session.players[session.voteVoterIndex];

      if (!voter || voter.id === action.targetPlayerId) {
        return session;
      }

      if (
        session.status === "tie_break_voting" &&
        !session.tieCandidateIds.includes(action.targetPlayerId)
      ) {
        return session;
      }

      const currentRound = {
        ...session.currentRound,
        votes: [
          ...session.currentRound.votes,
          {
            voterPlayerId: voter.id,
            targetPlayerId: action.targetPlayerId,
            phase,
          },
        ],
      };
      const nextVoterIndex = session.voteVoterIndex + 1;
      const nextSession = touch({
        ...session,
        currentRound,
        voteVoterIndex: nextVoterIndex,
      });

      if (nextVoterIndex >= session.players.length) {
        return finishVoting(nextSession, phase);
      }

      return nextSession;
    }

    case "CONTINUE_FROM_REVEAL": {
      if (!session.currentRound?.result) {
        return session;
      }

      if (
        session.currentRound.result.outcome === "impostor_detected" &&
        session.settings.finalGuessEnabled
      ) {
        return touch({ ...session, status: "final_guess_phase" });
      }

      return scoreRound(session);
    }

    case "SUBMIT_FINAL_GUESS": {
      if (!session.currentRound?.result) {
        return session;
      }

      const finalGuess = {
        value: action.guess,
        correct: isFinalGuessCorrect(action.guess, session.currentRound.secretWordValue),
      };
      const currentRound = {
        ...session.currentRound,
        finalGuess,
        result: applyFinalGuess(session.currentRound.result, finalGuess),
      };

      return scoreRound({
        ...session,
        currentRound,
      });
    }

    case "NEXT_ROUND":
      if (session.currentRoundNumber >= session.settings.roundsTotal) {
        return touch({ ...session, status: "finished" });
      }

      return gameReducer(
        {
          ...session,
          currentRound: null,
        },
        { type: "BEGIN_ROUND" },
      );

    case "FINISH_GAME":
      return touch({ ...session, status: "finished" });

    default:
      return session;
  }
}
