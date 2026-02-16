import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  seed: number;
  created_at: string;
}

export async function submitScore(name: string, score: number, seed: number): Promise<void> {
  if (!supabase) return;
  await supabase.from("leaderboard").insert({ name, score, seed });
}

export async function getDailyLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .gte("created_at", today.toISOString())
    .order("score", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getTrackLeaderboard(seed: number, limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("seed", seed)
    .order("score", { ascending: false })
    .limit(limit);

  return data ?? [];
}
