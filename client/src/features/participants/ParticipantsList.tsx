import { useState } from 'react';
import {
  getDiscordAvatarUrl,
  getDiscordDefaultAvatarUrl,
  getDiscordUsernameLabel,
} from '../../discord/user';
import type { NormalizedParticipant } from '../../discord/participants';

type ParticipantsListProps = {
  currentUserId?: string;
  errorMessage?: string;
  participants: NormalizedParticipant[];
  status: 'error' | 'idle' | 'loading' | 'ready';
};

type ParticipantRowProps = {
  currentUserId?: string;
  participant: NormalizedParticipant;
};

function ParticipantRow({ currentUserId, participant }: ParticipantRowProps) {
  const [avatarUrl, setAvatarUrl] = useState(() => getDiscordAvatarUrl(participant, 128));
  const isCurrentUser = participant.id === currentUserId;

  return (
    <li className="participant-row">
      <img
        alt={`${participant.displayName} avatar`}
        className="participant-avatar"
        onError={() => {
          setAvatarUrl(getDiscordDefaultAvatarUrl(participant));
        }}
        src={avatarUrl}
      />

      <div className="participant-copy">
        <div className="participant-name-line">
          <h3>{participant.displayName}</h3>
          {isCurrentUser ? <span className="participant-you">You</span> : null}
        </div>
        <p>{getDiscordUsernameLabel(participant)}</p>
      </div>
    </li>
  );
}

export function ParticipantsList({
  currentUserId,
  errorMessage,
  participants,
  status,
}: ParticipantsListProps) {
  return (
    <section className="panel participants-panel">
      <div className="participants-header">
        <div>
          <p className="eyebrow">Phase 4 Participants</p>
          <h2>People In Session</h2>
        </div>
        <span className="status-chip status-ready">{participants.length} connected</span>
      </div>

      {status === 'idle' ? (
        <p>Waiting for the Discord SDK before loading connected participants.</p>
      ) : null}
      {status === 'loading' ? <p>Loading connected participants...</p> : null}
      {status === 'error' ? <p className="error">{errorMessage}</p> : null}
      {status === 'ready' && participants.length === 0 ? (
        <p>No connected participants reported yet.</p>
      ) : null}
      {status === 'ready' && participants.length > 0 ? (
        <ol className="participants-list">
          {participants.map((participant) => (
            <ParticipantRow
              currentUserId={currentUserId}
              key={participant.id}
              participant={participant}
            />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
