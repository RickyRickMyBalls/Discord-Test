import type { AuthenticatedUser } from './auth';

export type DiscordSdkParticipant = {
  avatar?: string | null;
  bot: boolean;
  discriminator: string;
  flags: number;
  global_name?: string | null;
  id: string;
  nickname?: string;
  username: string;
};

export type NormalizedParticipant = {
  avatar: string | null;
  discriminator: string;
  displayName: string;
  globalName: string | null;
  id: string;
  username: string;
};

export const normalizeParticipant = (
  participant: DiscordSdkParticipant,
): NormalizedParticipant => {
  const nickname = participant.nickname?.trim();
  const globalName = participant.global_name?.trim();

  return {
    avatar: participant.avatar ?? null,
    discriminator: participant.discriminator,
    displayName: nickname || globalName || participant.username,
    globalName: participant.global_name ?? null,
    id: participant.id,
    username: participant.username,
  };
};

export const normalizeParticipants = (
  participants: DiscordSdkParticipant[],
  currentUser?: AuthenticatedUser,
): NormalizedParticipant[] => {
  const dedupedParticipants = new Map<string, NormalizedParticipant>();

  if (currentUser) {
    dedupedParticipants.set(currentUser.id, {
      avatar: currentUser.avatar,
      discriminator: currentUser.discriminator,
      displayName: currentUser.globalName?.trim() || currentUser.username,
      globalName: currentUser.globalName,
      id: currentUser.id,
      username: currentUser.username,
    });
  }

  for (const participant of participants) {
    dedupedParticipants.set(participant.id, normalizeParticipant(participant));
  }

  return [...dedupedParticipants.values()].sort((left, right) => {
    const displayNameCompare = left.displayName.localeCompare(right.displayName);

    if (displayNameCompare !== 0) {
      return displayNameCompare;
    }

    const usernameCompare = left.username.localeCompare(right.username);

    if (usernameCompare !== 0) {
      return usernameCompare;
    }

    return left.id.localeCompare(right.id);
  });
};
