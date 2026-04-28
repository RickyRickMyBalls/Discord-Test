import type { AuthenticatedUser } from './auth';

const DISCORD_CDN_BASE_URL = 'https://cdn.discordapp.com';

const getDefaultAvatarIndex = (user: AuthenticatedUser) => {
  if (user.discriminator && user.discriminator !== '0') {
    return Number.parseInt(user.discriminator, 10) % 5;
  }

  return Number((BigInt(user.id) >> 22n) % 6n);
};

export const getDiscordDisplayName = (user: AuthenticatedUser) => {
  return user.globalName?.trim() || user.username;
};

export const getDiscordUsernameLabel = (user: AuthenticatedUser) => {
  return `@${user.username}`;
};

export const getDiscordDefaultAvatarUrl = (user: AuthenticatedUser) => {
  return `${DISCORD_CDN_BASE_URL}/embed/avatars/${getDefaultAvatarIndex(user)}.png`;
};

export const getDiscordAvatarUrl = (user: AuthenticatedUser, size = 128) => {
  if (!user.avatar) {
    return getDiscordDefaultAvatarUrl(user);
  }

  const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';

  return `${DISCORD_CDN_BASE_URL}/avatars/${user.id}/${user.avatar}.${extension}?size=${size}`;
};
