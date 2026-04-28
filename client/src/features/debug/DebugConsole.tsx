import { useState } from 'react';

export type DebugLogEntry = {
  detail?: string;
  id: number;
  level: 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
};

type DebugConsoleProps = {
  entries: DebugLogEntry[];
};

export function DebugConsole({ entries }: DebugConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="panel debug-console">
      <div className="debug-console-header">
        <h2>Debug Console</h2>
        <div className="debug-console-actions">
          <span className="debug-console-count">{entries.length} events</span>
          <button
            className="secondary-button"
            onClick={() => {
              setIsExpanded((currentValue) => !currentValue);
            }}
            type="button"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <p className="debug-console-summary">
          Debug events are collapsed so the main Activity UI has more room.
        </p>
      ) : entries.length === 0 ? (
        <p>No debug events yet.</p>
      ) : (
        <ol className="debug-console-list">
          {entries.map((entry) => (
            <li className={`debug-console-item debug-console-item-${entry.level}`} key={entry.id}>
              <div className="debug-console-meta">
                <span className="debug-console-time">{entry.timestamp}</span>
                <span className="debug-console-level">{entry.level}</span>
              </div>
              <p className="debug-console-message">{entry.message}</p>
              {entry.detail ? <pre className="debug-console-detail">{entry.detail}</pre> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
