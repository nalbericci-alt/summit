import { useEffect, useState } from "react";
import { readinessRecommendation } from "../../engine/readiness";
import type { ReadinessLevel, ReadinessResult } from "../../engine/readiness";
import { getCheckin, saveCheckin } from "../../storage/checkins";
import type { CheckinRecord } from "../../storage/schema";

export interface ReadinessCardProps {
  date: string;
}

interface SegmentOption<T> {
  value: T;
  label: string;
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="row">
      <span>{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SLEEP_OPTIONS: SegmentOption<ReadinessLevel>[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Good" },
];
const SORENESS_OPTIONS: SegmentOption<ReadinessLevel>[] = [
  { value: 1, label: "High" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Low" },
];
const ENERGY_OPTIONS: SegmentOption<ReadinessLevel>[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "Normal" },
  { value: 3, label: "High" },
];
const SYMPTOM_OPTIONS: SegmentOption<"no" | "yes">[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

/** Three-tap readiness check-in. The symptoms question always renders: it is never hidden by a computed result. */
export function ReadinessCard({ date }: ReadinessCardProps) {
  const [sleep, setSleep] = useState<ReadinessLevel>(2);
  const [soreness, setSoreness] = useState<ReadinessLevel>(2);
  const [energy, setEnergy] = useState<ReadinessLevel>(2);
  const [symptoms, setSymptoms] = useState(false);
  const [saved, setSaved] = useState<CheckinRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await getCheckin(date);
      if (cancelled) return;
      if (existing) {
        setSleep(existing.sleep);
        setSoreness(existing.soreness);
        setEnergy(existing.energy);
        setSymptoms(existing.symptoms);
        setSaved(existing);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function save() {
    const record: CheckinRecord = {
      date,
      sleep,
      soreness,
      energy,
      symptoms,
      note: "",
      createdAt: saved?.createdAt ?? new Date().toISOString(),
    };
    await saveCheckin(record);
    setSaved(record);
  }

  const recommendation: ReadinessResult | null = saved ? readinessRecommendation(saved) : null;

  return (
    <div className="card">
      <h2>Readiness check-in</h2>

      <Segmented label="Sleep" options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} />
      <Segmented label="Soreness" options={SORENESS_OPTIONS} value={soreness} onChange={setSoreness} />
      <Segmented label="Energy" options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
      <Segmented
        label="Symptoms"
        options={SYMPTOM_OPTIONS}
        value={symptoms ? "yes" : "no"}
        onChange={(v) => setSymptoms(v === "yes")}
      />

      <button type="button" className="button-primary" onClick={() => void save()} disabled={!loaded}>
        Save check-in
      </button>

      {recommendation && (
        <div className="card">
          <p>
            <strong>{recommendation.status}</strong>
          </p>
          <ul>
            {recommendation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {recommendation.adjustments.length > 0 && (
            <ul>
              {recommendation.adjustments.map((adjustment) => (
                <li key={adjustment}>{adjustment}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
