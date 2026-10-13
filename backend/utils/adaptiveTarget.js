/**
 * adaptiveTarget.js
 *
 * Bridge and re-export module for Athena's Adaptive Daily Focus Target Engine.
 */

import {
  calculateAdaptiveTarget,
  formatTargetRecommendation,
  TARGET_WINDOW_DAYS,
  MIN_ACTIVE_DAYS_REQUIRED,
  TARGET_STEP_MINUTES,
  DEFAULT_MIN_TARGET,
  DEFAULT_MAX_TARGET,
  DEFAULT_DAILY_TARGET,
} from "./targetEngine.js";

export {
  calculateAdaptiveTarget,
  formatTargetRecommendation,
  TARGET_WINDOW_DAYS,
  MIN_ACTIVE_DAYS_REQUIRED,
  TARGET_STEP_MINUTES,
  DEFAULT_MIN_TARGET,
  DEFAULT_MAX_TARGET,
  DEFAULT_DAILY_TARGET,
};

export default {
  calculateAdaptiveTarget,
  formatTargetRecommendation,
};
