import type { Player } from "@/app/_game/types";

export const avatarIds = [
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
] as const;

export type AvatarId = (typeof avatarIds)[number];

export function getAvatarSrc(avatarId: string) {
  return `/avatars-transparent/${avatarId}.png`;
}

function shuffleItems<T>(items: T[], random = Math.random) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }

  return next;
}

export function pickAvatarIds(
  count: number,
  takenAvatarIds: string[] = [],
  random = Math.random,
): string[] {
  if (count <= 0) {
    return [];
  }

  const takenSet = new Set(takenAvatarIds);
  const available = avatarIds.filter((avatarId) => !takenSet.has(avatarId));

  if (count <= available.length) {
    return shuffleItems(available, random).slice(0, count);
  }

  const uniquePool = shuffleItems(avatarIds, random);
  const selected = shuffleItems(available, random);

  while (selected.length < count) {
    selected.push(uniquePool[(selected.length - available.length) % uniquePool.length]!);
  }

  return selected;
}

export function repairPlayerAvatars(players: Player[], random = Math.random): Player[] {
  const assignedAvatarIds = new Set<string>();

  for (const player of players) {
    if (player.avatarId) {
      assignedAvatarIds.add(player.avatarId);
    }
  }

  return players.map((player) => {
    if (player.avatarId) {
      return player;
    }

    const [avatarId] = pickAvatarIds(1, [...assignedAvatarIds], random);
    assignedAvatarIds.add(avatarId);
    return { ...player, avatarId };
  });
}
