"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  id: number | null;
  name: string;
};

type Props = {
  value: number | null;
  options: Option[];
  onChange: (value: number | null) => void;
  isDirty?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

const NULL_SENTINEL = "__null__";

function encode(value: number | null): string {
  return value === null ? NULL_SENTINEL : String(value);
}

function decode(raw: string | null): number | null {
  if (raw === null || raw === NULL_SENTINEL) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function InlineSelect({
  value,
  options,
  onChange,
  isDirty,
  disabled,
  ariaLabel,
}: Props) {
  const labelFor = (raw: string | null): string => {
    const decoded = decode(raw);
    const match = options.find((o) => o.id === decoded);
    return match?.name ?? "(알 수 없음)";
  };

  return (
    <Select
      value={encode(value)}
      onValueChange={(raw) => {
        onChange(decode(raw));
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "min-w-[120px]",
          isDirty &&
            "border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
        )}
      >
        <SelectValue>
          {(raw: string | null) => labelFor(raw)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={encode(opt.id)} value={encode(opt.id)}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
