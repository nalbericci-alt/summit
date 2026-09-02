import { useSummit } from "../../app/state";

const PLATE_OPTIONS = [45, 35, 25, 10, 5, 2.5, 1.25];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="row">
      <span>{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((opt) => (
          <button key={opt.value} type="button" aria-pressed={value === opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Every day-to-day preference. Each control saves immediately through updateSetting. */
export function PreferencesCard() {
  const { settings, updateSetting } = useSummit();

  function togglePlate(value: number, checked: boolean) {
    const next = checked
      ? [...settings.plateSet, value].sort((a, b) => b - a)
      : settings.plateSet.filter((p) => p !== value);
    void updateSetting("plateSet", next);
  }

  return (
    <div className="card">
      <h2>Preferences</h2>

      <Segmented
        label="Effort input"
        options={[{ value: "rpe", label: "RPE" }, { value: "rir", label: "RIR" }] as const}
        value={settings.effortInput}
        onChange={(v) => void updateSetting("effortInput", v)}
      />
      <Segmented
        label="Theme"
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
          { value: "system", label: "System" },
        ] as const}
        value={settings.theme}
        onChange={(v) => void updateSetting("theme", v)}
      />
      <Segmented
        label="Big type"
        options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }] as const}
        value={settings.bigType ? "on" : "off"}
        onChange={(v) => void updateSetting("bigType", v === "on")}
      />
      <Segmented
        label="Handedness"
        options={[{ value: "right", label: "Right" }, { value: "left", label: "Left" }] as const}
        value={settings.handedness}
        onChange={(v) => void updateSetting("handedness", v)}
      />

      <label className="field">
        Main lift rest (seconds)
        <input
          type="number"
          step={15}
          value={settings.restDefaults.mainLift}
          onChange={(e) => void updateSetting("restDefaults", { ...settings.restDefaults, mainLift: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        Accessory rest (seconds)
        <input
          type="number"
          step={15}
          value={settings.restDefaults.accessory}
          onChange={(e) => void updateSetting("restDefaults", { ...settings.restDefaults, accessory: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        Bar weight (lb)
        <input
          type="number"
          step={5}
          value={settings.barLb}
          onChange={(e) => void updateSetting("barLb", Number(e.target.value))}
        />
      </label>

      <fieldset className="field">
        <legend>Plate set (per side)</legend>
        {PLATE_OPTIONS.map((p) => (
          <label key={p} className="row">
            <span>{p} lb</span>
            <input type="checkbox" checked={settings.plateSet.includes(p)} onChange={(e) => togglePlate(p, e.target.checked)} />
          </label>
        ))}
      </fieldset>
    </div>
  );
}
