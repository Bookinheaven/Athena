import { getRecentStreakDays } from "./streakHelpers";

export async function adaptDailyTarget(user) {
  const recentDays = await getRecentStreakDays(user._id, 7);

  if (recentDays.length < 5) return;

  const last5 = recentDays.slice(0, 5);

  const avgRate =
    last5.reduce((sum, d) => sum + d.streakRate, 0) / last5.length;

  const redDays = last5.filter((d) => d.state === "red").length;

  const freezeUsedCount = recentDays.reduce((sum, d) => sum + d.freezeUsed, 0);

  let newTarget = user.streak.dailyTargetMinutes;

  const MIN = user.streak.minTargetMinutes;
  const MAX = user.streak.maxTargetMinutes;
  const STEP = 5;
  let reason = "no_change";

  if (avgRate >= 1.1 && freezeUsedCount === 0 && newTarget < MAX) {
    newTarget = Math.min(newTarget + STEP, MAX);
    reason = "increase_consistency";
  } else if ((redDays >= 2 || freezeUsedCount >= 2) && newTarget > MIN) {
    newTarget = Math.max(newTarget - STEP, MIN);
    reason = "decrease_burnout";
  }
  user.streak.dailyTargetMinutes = newTarget;
  user.streak.lastTargetReason = "increase_consistency";
}
