"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { readGroups } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import type { ParticipantGroup } from "@/lib/types";
import { ActionButton, ActionError, SelectField } from "./collaboration-ui";

export function GroupPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [groups, setGroups] = useState<ParticipantGroup[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setGroups(await readGroups());
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    let active = true;
    void readGroups()
      .then((data) => {
        if (active) setGroups(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-2 text-sm font-medium">
        Zaproś stałą grupę (opcjonalnie)
        <SelectField
          value={value}
          disabled={disabled || groups === null}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {groups === null ? "Wczytywanie grup..." : "Bez grupy"}
          </option>
          {groups?.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.members.length} osób)
            </option>
          ))}
        </SelectField>
      </label>
      <p className="text-sm leading-relaxed text-muted">
        Członkowie dostaną zaproszenie w powiadomieniach i sami zdecydują o
        dołączeniu.{" "}
        <Link
          className="text-[#cfbdff] underline underline-offset-4"
          href="/groups"
        >
          Zarządzaj grupami
        </Link>
      </p>
      <ActionError>{error}</ActionError>
      {error && (
        <ActionButton onClick={() => void load()}>
          Wczytaj grupy ponownie
        </ActionButton>
      )}
    </div>
  );
}
