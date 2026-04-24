import { beforeEach, describe, expect, test } from "vitest";
import { avatarIds } from "@/app/_game/avatars";
import { gameReducer, createInitialSession } from "@/app/_game/reducer";
import { getPlayerRole } from "@/app/_game/roles";
import {
  createRound,
  getVoteCandidates,
  isFinalGuessCorrect,
} from "@/app/_game/rules";
import { clearSession, loadSession, saveSession, STORAGE_KEY } from "@/app/_game/storage";
import type { GameSession } from "@/app/_game/types";

function namedSession(playerCount = 4) {
  let session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
  session = gameReducer(session, {
    type: "UPDATE_SETTINGS",
    settings: { playerCount, roundsTotal: 3, finalGuessEnabled: true },
  });
  session = gameReducer(session, { type: "GO_TO_PLAYER_ENTRY" });

  session.players.forEach((player, index) => {
    session = gameReducer(session, {
      type: "SET_PLAYER_NAME",
      playerId: player.id,
      name: `Jugador ${index + 1}`,
    });
  });

  return gameReducer(session, { type: "BEGIN_ROUND" });
}

function forceVoting(session: GameSession): GameSession {
  return {
    ...session,
    status: "voting_phase",
    voteVoterIndex: 0,
  };
}

describe("game rules", () => {
  test("creates players with unique avatar ids while avatars are available", () => {
    const session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
    const avatarIdsInSession = session.players.map((player) => player.avatarId);

    expect(avatarIdsInSession).toHaveLength(session.settings.playerCount);
    expect(new Set(avatarIdsInSession).size).toBe(session.settings.playerCount);
    expect(avatarIdsInSession.every((avatarId) => avatarIds.includes(avatarId as (typeof avatarIds)[number]))).toBe(true);
  });

  test("creates a round with one impostor and one valid word", () => {
    const session = namedSession(5);
    const round = createRound(1, session.players, session.settings, () => 0);

    expect(session.players.some((player) => player.id === round.impostorPlayerId)).toBe(true);
    expect(round.secretWordValue.length).toBeGreaterThan(0);
    expect(round.turnOrderPlayerIds).toHaveLength(5);
  });

  test("excludes the voter from vote candidates", () => {
    const session = namedSession(3);
    const voter = session.players[0];
    const candidates = getVoteCandidates(session.players, voter.id);

    expect(candidates.map((candidate) => candidate.id)).not.toContain(voter.id);
    expect(candidates).toHaveLength(2);
  });

  test("normalizes final guesses with trim and case-insensitive comparison", () => {
    expect(isFinalGuessCorrect("  PIZZA ", "pizza")).toBe(true);
    expect(isFinalGuessCorrect("pizzas", "pizza")).toBe(false);
  });

  test("derives impostor and citizen roles from the current round", () => {
    const session = namedSession(4);
    const round = session.currentRound!;
    const impostor = session.players.find((player) => player.id === round.impostorPlayerId)!;
    const citizen = session.players.find((player) => player.id !== round.impostorPlayerId)!;

    expect(getPlayerRole(impostor.id, round)).toBe("impostor");
    expect(getPlayerRole(citizen.id, round)).toBe("citizen");
  });
});

describe("game reducer", () => {
  test("keeps settings and names when going back to setup", () => {
    let session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
    session = gameReducer(session, {
      type: "UPDATE_SETTINGS",
      settings: { playerCount: 3, roundsTotal: 7, categoryId: "animales" },
    });
    session = gameReducer(session, { type: "GO_TO_PLAYER_ENTRY" });
    session = gameReducer(session, {
      type: "SET_PLAYER_NAME",
      playerId: session.players[0].id,
      name: "Ana",
    });

    session = gameReducer(session, { type: "GO_TO_SETUP" });

    expect(session.status).toBe("setup");
    expect(session.settings.roundsTotal).toBe(7);
    expect(session.settings.categoryId).toBe("animales");
    expect(session.players[0].name).toBe("Ana");
    expect(session.players[0].avatarId).toBeTruthy();
  });

  test("keeps existing avatars and assigns unique avatars to added players", () => {
    let session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
    const originalAvatarIds = session.players.map((player) => player.avatarId);

    session = gameReducer(session, {
      type: "UPDATE_SETTINGS",
      settings: { playerCount: session.settings.playerCount + 2 },
    });

    expect(session.players.slice(0, originalAvatarIds.length).map((player) => player.avatarId)).toEqual(originalAvatarIds);
    expect(new Set(session.players.map((player) => player.avatarId)).size).toBe(session.players.length);
  });

  test("aborts current round back to player entry without changing scores", () => {
    let session = namedSession(3);
    const roundId = session.currentRound?.id;

    session = {
      ...session,
      roleDistributionIndex: 1,
      players: session.players.map((player, index) => ({
        ...player,
        score: index,
      })),
    };

    session = gameReducer(session, { type: "ABORT_CURRENT_ROUND_TO_PLAYER_ENTRY" });

    expect(roundId).toBeDefined();
    expect(session.status).toBe("player_entry");
    expect(session.currentRound).toBeNull();
    expect(session.currentRoundNumber).toBe(0);
    expect(session.roleDistributionIndex).toBe(0);
    expect(session.players.map((player) => player.score)).toEqual([0, 1, 2]);
  });

  test("goes back from debate to the last clue turn", () => {
    let session = namedSession(4);

    session = {
      ...session,
      status: "debate_phase",
      clueTurnIndex: 0,
    };

    session = gameReducer(session, { type: "GO_BACK_TO_CLUES" });

    expect(session.status).toBe("clue_phase");
    expect(session.clueTurnIndex).toBe(3);
  });

  test("goes back from voting to debate only before primary votes exist", () => {
    let session = forceVoting(namedSession(3));

    session = gameReducer(session, { type: "GO_BACK_TO_DEBATE" });
    expect(session.status).toBe("debate_phase");

    session = forceVoting(session);
    session = gameReducer(session, {
      type: "CAST_VOTE",
      targetPlayerId: session.players[1].id,
    });
    const withVote = gameReducer(session, { type: "GO_BACK_TO_DEBATE" });

    expect(withVote.status).toBe("voting_phase");
    expect(withVote.currentRound?.votes).toHaveLength(1);
  });

  test("blocks self voting", () => {
    let session = forceVoting(namedSession(3));
    const voter = session.players[0];

    session = gameReducer(session, {
      type: "CAST_VOTE",
      targetPlayerId: voter.id,
    });

    expect(session.currentRound?.votes).toHaveLength(0);
    expect(session.voteVoterIndex).toBe(0);
  });

  test("detects the impostor and applies final-guess score", () => {
    let session = forceVoting(namedSession(3));
    const impostorId = session.currentRound?.impostorPlayerId;
    const innocent = session.players.find((player) => player.id !== impostorId);

    for (const voter of session.players) {
      session = gameReducer(session, {
        type: "CAST_VOTE",
        targetPlayerId: voter.id === impostorId ? innocent!.id : impostorId!,
      });
    }

    expect(session.status).toBe("reveal_phase");
    expect(session.currentRound?.result?.outcome).toBe("impostor_detected");

    session = gameReducer(session, { type: "CONTINUE_FROM_REVEAL" });
    expect(session.status).toBe("final_guess_phase");

    session = gameReducer(session, {
      type: "SUBMIT_FINAL_GUESS",
      guess: session.currentRound!.secretWordValue,
    });

    expect(session.status).toBe("scoreboard_phase");
    expect(session.players.every((player) => player.score === 1)).toBe(true);
  });

  test("starts a tie-break vote after a primary tie", () => {
    let session = forceVoting(namedSession(4));
    const [a, b, c, d] = session.players;

    for (const targetPlayerId of [b.id, a.id, a.id, b.id]) {
      session = gameReducer(session, { type: "CAST_VOTE", targetPlayerId });
    }

    expect(c.id).toBeDefined();
    expect(d.id).toBeDefined();
    expect(session.status).toBe("tie_break_voting");
    expect(session.tieCandidateIds.sort()).toEqual([a.id, b.id].sort());
  });

  test("persistent tie makes the impostor win the round", () => {
    let session = forceVoting(namedSession(4));
    const [a, b] = session.players;

    for (const targetPlayerId of [b.id, a.id, a.id, b.id]) {
      session = gameReducer(session, { type: "CAST_VOTE", targetPlayerId });
    }

    for (const targetPlayerId of [b.id, a.id, a.id, b.id]) {
      session = gameReducer(session, { type: "CAST_VOTE", targetPlayerId });
    }

    expect(session.status).toBe("reveal_phase");
    expect(session.currentRound?.result?.outcome).toBe("impostor_survived");
    expect(session.currentRound?.result?.expelledPlayerId).toBeNull();

    session = gameReducer(session, { type: "CONTINUE_FROM_REVEAL" });
    expect(session.status).toBe("scoreboard_phase");
    expect(session.players.find((player) => player.id === session.currentRound?.impostorPlayerId)?.score).toBe(3);
  });
});

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("saves and loads an active session", () => {
    const session = namedSession(3);

    saveSession(session);

    expect(loadSession()?.id).toBe(session.id);
    expect(loadSession()?.players.map((player) => player.avatarId)).toEqual(session.players.map((player) => player.avatarId));
  });

  test("ignores and clears corrupt sessions", () => {
    localStorage.setItem(STORAGE_KEY, "{bad json");

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("clears a session explicitly", () => {
    saveSession(namedSession(3));
    clearSession();

    expect(loadSession()).toBeNull();
  });

  test("repairs missing avatar ids from older sessions", () => {
    const session = namedSession(3);
    const legacySession = {
      ...session,
      players: session.players.map(({ avatarId, ...player }) => {
        void avatarId;
        return player;
      }),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySession));

    const loaded = loadSession();

    expect(loaded).not.toBeNull();
    expect(loaded?.players.every((player) => player.avatarId)).toBe(true);
    expect(new Set(loaded?.players.map((player) => player.avatarId)).size).toBe(3);
  });
});
