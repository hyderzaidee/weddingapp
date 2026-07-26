import { getSupabase } from "@/lib/supabase";

export const DEFAULT_EVENT_NAMES = [
  "Mehendi",
  "Haldi",
  "Sangeet",
  "Wedding",
  "Reception",
] as const;

export type EventSelectOption = {
  label: string;
  value: string;
};

export function buildEventSelectOptions(
  eventNames: string[],
  extraNames: string[] = []
): EventSelectOption[] {
  const names = new Set<string>();

  for (const name of [...eventNames, ...extraNames]) {
    const trimmed = name.trim();
    if (trimmed) names.add(trimmed);
  }

  if (names.size === 0) {
    for (const name of DEFAULT_EVENT_NAMES) names.add(name);
  }

  const options = Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name }));

  if (!names.has("Other")) {
    options.push({ label: "Other", value: "Other" });
  }

  return options;
}

/** If the events table is empty, seed the default celebration names. */
export async function ensureDefaultEvents(): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("events").select("id").limit(1);

  if (error) {
    throw new Error(error.message || "Failed to check events.");
  }

  if ((data?.length ?? 0) > 0) return;

  const { error: insertError } = await supabase.from("events").insert(
    DEFAULT_EVENT_NAMES.map((event_name) => ({ event_name }))
  );

  if (insertError) {
    throw new Error(insertError.message || "Failed to seed default events.");
  }
}
