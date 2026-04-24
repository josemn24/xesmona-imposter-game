import { describe, expect, test } from "vitest";
import {
  countVotes,
  defaultSettings,
  getTopVotedPlayerIds,
  hasValidManualSecretWord,
  resetRoundScopedSettings,
  resolveVotes,
  sanitizeManualSecretWord,
  selectRandomItem,
} from "@/app/_game/rules";
import type { Round, Vote } from "@/app/_game/types";

const baseVotes: Vote[] = [
  { voterPlayerId: "player-1", targetPlayerId: "player-2", phase: "primary" },
  { voterPlayerId: "player-2", targetPlayerId: "player-3", phase: "primary" },
  { voterPlayerId: "player-3", targetPlayerId: "player-2", phase: "primary" },
  { voterPlayerId: "player-1", targetPlayerId: "player-2", phase: "tieBreak" },
];

function buildRound(votes: Vote[], impostorPlayerId = "player-2"): Round {
  return {
    id: "round-1",
    roundNumber: 1,
    secretWordId: "word-1",
    secretWordValue: "pizza",
    categoryId: "comida",
    impostorPlayerId,
    startingPlayerId: "player-1",
    turnOrderPlayerIds: ["player-1", "player-2", "player-3"],
    votes,
    result: null,
    finalGuess: null,
  };
}

describe("rules helpers", () => {
  test("sanitizes manual secret words with trim only", () => {
    expect(sanitizeManualSecretWord("  hola mundo  ")).toBe("hola mundo");
  });

  test("validates manual secret words", () => {
    expect(
      hasValidManualSecretWord({
        ...defaultSettings,
        wordMode: "manual",
        manualSecretWord: "   ",
      }),
    ).toBe(false);

    expect(
      hasValidManualSecretWord({
        ...defaultSettings,
        wordMode: "manual",
        manualSecretWord: " Paella ",
      }),
    ).toBe(true);
  });

  test("throws when selecting a random item from an empty list", () => {
    expect(() => selectRandomItem([])).toThrow("Cannot select from an empty list");
  });

  test("counts votes by phase only", () => {
    expect(countVotes(baseVotes, "primary")).toEqual({
      "player-2": 2,
      "player-3": 1,
    });
    expect(countVotes(baseVotes, "tieBreak")).toEqual({
      "player-2": 1,
    });
  });

  test("returns top voted ids for empty, majority and tied results", () => {
    expect(getTopVotedPlayerIds([], "primary")).toEqual([]);
    expect(getTopVotedPlayerIds(baseVotes, "primary")).toEqual(["player-2"]);
    expect(
      getTopVotedPlayerIds(
        [
          { voterPlayerId: "player-1", targetPlayerId: "player-2", phase: "primary" },
          { voterPlayerId: "player-2", targetPlayerId: "player-3", phase: "primary" },
        ],
        "primary",
      ).sort(),
    ).toEqual(["player-2", "player-3"]);
  });

  test("returns tie candidates for a primary tie", () => {
    const result = resolveVotes(
      buildRound([
        { voterPlayerId: "player-1", targetPlayerId: "player-2", phase: "primary" },
        { voterPlayerId: "player-2", targetPlayerId: "player-3", phase: "primary" },
      ]),
      "primary",
    );

    expect("tie" in result && result.tie.sort()).toEqual(["player-2", "player-3"]);
  });

  test("detects the impostor when the top-voted player matches", () => {
    const result = resolveVotes(buildRound(baseVotes), "primary");

    expect("tie" in result).toBe(false);
    if ("tie" in result) {
      return;
    }

    expect(result.outcome).toBe("impostor_detected");
    expect(result.expelledPlayerId).toBe("player-2");
    expect(result.impostorWon).toBe(false);
  });

  test("marks the impostor as survived when an innocent player is expelled", () => {
    const result = resolveVotes(
      buildRound(
        [
          { voterPlayerId: "player-1", targetPlayerId: "player-3", phase: "primary" },
          { voterPlayerId: "player-2", targetPlayerId: "player-3", phase: "primary" },
          { voterPlayerId: "player-3", targetPlayerId: "player-2", phase: "primary" },
        ],
        "player-2",
      ),
      "primary",
    );

    expect("tie" in result).toBe(false);
    if ("tie" in result) {
      return;
    }

    expect(result.outcome).toBe("impostor_survived");
    expect(result.expelledPlayerId).toBe("player-3");
    expect(result.impostorWon).toBe(true);
  });

  test("marks a persistent tie-break tie as impostor survival without expulsion", () => {
    const result = resolveVotes(
      buildRound([
        { voterPlayerId: "player-1", targetPlayerId: "player-2", phase: "tieBreak" },
        { voterPlayerId: "player-2", targetPlayerId: "player-3", phase: "tieBreak" },
      ]),
      "tieBreak",
    );

    expect("tie" in result).toBe(false);
    if ("tie" in result) {
      return;
    }

    expect(result.outcome).toBe("impostor_survived");
    expect(result.expelledPlayerId).toBeNull();
    expect(result.tiedPlayerIds.sort()).toEqual(["player-2", "player-3"]);
  });

  test("cleans round-scoped manual settings and preserves random settings", () => {
    expect(
      resetRoundScopedSettings({
        ...defaultSettings,
        wordMode: "manual",
        manualSecretWord: "Gazpacho",
      }),
    ).toEqual({
      ...defaultSettings,
      wordMode: "random",
      manualSecretWord: "",
    });

    const randomSettings = {
      ...defaultSettings,
      wordMode: "random" as const,
      manualSecretWord: "",
    };
    expect(resetRoundScopedSettings(randomSettings)).toBe(randomSettings);
  });
});
