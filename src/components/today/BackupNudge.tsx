/** Sunday-only nudge shown when a backup is overdue. See TodayScreen for the trigger rule. */
export function BackupNudge() {
  return (
    <div className="card">
      <h2>Back up your workouts</h2>
      <p className="muted">It's Sunday. A quick backup keeps your history safe.</p>
      <a className="button-secondary" href="#/more">
        Go to More
      </a>
    </div>
  );
}
