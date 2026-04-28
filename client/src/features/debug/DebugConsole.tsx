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
  return (
    <section className="panel debug-console">
      <div className="debug-console-header">
        <h2>Debug Console</h2>
        <span className="debug-console-count">{entries.length} events</span>
      </div>

      {entries.length === 0 ? (
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
