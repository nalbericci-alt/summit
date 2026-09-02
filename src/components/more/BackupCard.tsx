import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useSummit } from "../../app/state";
import { exportBackup, importBackup, previewBackup } from "../../storage/backup";
import type { BackupPreview } from "../../storage/backup";

function backupFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `summit-backup-${y}-${m}-${day}.json`;
}

interface PendingImport {
  json: unknown;
  preview: Extract<BackupPreview, { ok: true }>;
}

/** Back up now (share or download) and Restore (preview, confirm, then replace). */
export function BackupCard() {
  const { settings, updateSetting, refresh } = useSummit();
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function backUpNow() {
    setBusy(true);
    setDownloadUrl(null);
    try {
      const backup = await exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = backupFilename();
      const file = new File([json], filename, { type: "application/json" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        await updateSetting("lastBackupAt", new Date().toISOString());
      } else {
        setDownloadUrl(URL.createObjectURL(new Blob([json], { type: "application/json" })));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImport(null);
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      setRestoreError("That file is not valid JSON.");
      return;
    }
    const preview = previewBackup(json);
    if (!preview.ok) {
      setRestoreError(preview.reason);
      return;
    }
    setRestoreError(null);
    setPendingImport({ json, preview });
  }

  async function confirmRestore() {
    if (!pendingImport) return;
    await importBackup(pendingImport.json);
    setPendingImport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await refresh();
  }

  const lastBackupLabel = settings.lastBackupAt
    ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleString()}`
    : "Never backed up";

  return (
    <div className="card">
      <h2>Back up</h2>
      <p className="muted">{lastBackupLabel}</p>
      <button type="button" className="button-primary" onClick={() => void backUpNow()} disabled={busy}>
        {busy ? "Preparing..." : "Back up now"}
      </button>
      {downloadUrl && (
        <a
          className="button-secondary"
          href={downloadUrl}
          download={backupFilename()}
          onClick={() => void updateSetting("lastBackupAt", new Date().toISOString())}
        >
          Download backup file
        </a>
      )}

      <h2>Restore</h2>
      <input ref={fileInputRef} type="file" accept="application/json" onChange={(e) => void onFileSelected(e)} />
      {restoreError && <p className="error">{restoreError}</p>}
      {pendingImport && (
        <div className="card">
          <p>Backup from {new Date(pendingImport.preview.exportedAt).toLocaleString()}</p>
          <p>
            {pendingImport.preview.workoutCount} workouts, {pendingImport.preview.setCount} sets,{" "}
            {pendingImport.preview.checkinCount} check-ins
          </p>
          <p className="error">This replaces everything on this phone.</p>
          <button type="button" className="button-primary" onClick={() => void confirmRestore()}>
            Restore
          </button>
          <button type="button" className="button-secondary" onClick={() => setPendingImport(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
