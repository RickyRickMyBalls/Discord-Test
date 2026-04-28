import { useState } from 'react';
import type { DiscordAuthSuccess } from '../../discord/auth';
import {
  getDiscordAvatarUrl,
  getDiscordDefaultAvatarUrl,
  getDiscordDisplayName,
  getDiscordUsernameLabel,
} from '../../discord/user';

type CurrentUserCardProps = {
  auth: DiscordAuthSuccess;
};

export function CurrentUserCard({ auth }: CurrentUserCardProps) {
  const { user } = auth;
  const [avatarUrl, setAvatarUrl] = useState(() => getDiscordAvatarUrl(user, 256));

  return (
    <section className="panel current-user-card">
      <div className="current-user-header">
        <p className="eyebrow">Phase 3 Current User</p>
        <span className="status-chip status-authenticated">Authenticated</span>
      </div>

      <div className="current-user-body">
        <img
          alt={`${getDiscordDisplayName(user)} avatar`}
          className="current-user-avatar"
          onError={() => {
            setAvatarUrl(getDiscordDefaultAvatarUrl(user));
          }}
          src={avatarUrl}
        />

        <div className="current-user-copy">
          <h2>{getDiscordDisplayName(user)}</h2>
          <p className="current-user-username">{getDiscordUsernameLabel(user)}</p>
          <p className="current-user-summary">
            Signed into <code>{auth.application.name}</code> with the{' '}
            <code>{auth.scopes.join(', ')}</code> scope set.
          </p>
        </div>
      </div>
    </section>
  );
}
