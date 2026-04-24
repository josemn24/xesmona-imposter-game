import { describe, expect, test } from "vitest";
import { avatarIds, pickAvatarIds, repairPlayerAvatars } from "@/app/_game/avatars";
import type { Player } from "@/app/_game/types";

const basePlayers: Player[] = [
  {
    id: "player-1",
    name: "Jugador 1",
    score: 0,
    orderIndex: 0,
    isActive: true,
    avatarId: "avatar-01",
  },
  {
    id: "player-2",
    name: "Jugador 2",
    score: 0,
    orderIndex: 1,
    isActive: true,
    avatarId: "",
  },
  {
    id: "player-3",
    name: "Jugador 3",
    score: 0,
    orderIndex: 2,
    isActive: true,
    avatarId: "",
  },
];

describe("avatars helpers", () => {
  test("returns no avatar ids for non-positive counts", () => {
    expect(pickAvatarIds(0)).toEqual([]);
    expect(pickAvatarIds(-3)).toEqual([]);
  });

  test("avoids taken avatars while unique options remain", () => {
    const picked = pickAvatarIds(3, ["avatar-01", "avatar-02"], () => 0);

    expect(picked).toHaveLength(3);
    expect(picked).not.toContain("avatar-01");
    expect(picked).not.toContain("avatar-02");
    expect(new Set(picked).size).toBe(3);
  });

  test("fills the requested length after exhausting unique avatars", () => {
    const picked = pickAvatarIds(avatarIds.length + 2, [], () => 0);

    expect(picked).toHaveLength(avatarIds.length + 2);
    expect(new Set(picked).size).toBe(avatarIds.length);
  });

  test("repairs only players missing avatar ids", () => {
    const repaired = repairPlayerAvatars(basePlayers, () => 0);

    expect(repaired[0]?.avatarId).toBe("avatar-01");
    expect(repaired[1]?.avatarId).toBeTruthy();
    expect(repaired[2]?.avatarId).toBeTruthy();
    expect(repaired[1]?.avatarId).not.toBe("avatar-01");
    expect(repaired[2]?.avatarId).not.toBe("avatar-01");
    expect(repaired[1]?.avatarId).not.toBe(repaired[2]?.avatarId);
  });
});
