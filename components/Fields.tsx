"use client";
import { useLanguage } from "./LanguageProvider";
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: string;
}) {
  const { t } = useLanguage();
  return (
    <label className="field">
      <span>{t(label)}</span>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          placeholder={t(placeholder)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={t(placeholder)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useLanguage();
  return (
    <Field
      label={`${t(label)} · ${t("po jednej pozycji w wierszu")}`}
      value={value.join("\n")}
      onChange={(v) => onChange(v.split("\n"))}
      multiline
    />
  );
}
