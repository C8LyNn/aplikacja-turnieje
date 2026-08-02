import React, { type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  inputRef,
  minLength,
  description,
  detail,
  error,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  inputRef?: Ref<HTMLInputElement>;
  minLength?: number;
  description?: string;
  detail?: string;
  error?: string;
  onBlur?: () => void;
}) {
  const describedBy = [description || detail ? `${id}-help` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          minLength={minLength}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="pr-10"
        />
        <button
          type="button"
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {(description || detail) && (
        <div id={`${id}-help`} className="space-y-0.5 text-xs text-muted-foreground">
          {description && <p>{description}</p>}
          {detail && <p>{detail}</p>}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>{error}
        </p>
      )}
    </div>
  );
}
