import planningContextService from "./planningContextService.js";
import deterministicScheduler from "./deterministicScheduler.js";
import { getAiProvider } from "./providers/index.js";
import { AI_CONFIG } from "./aiConfig.js";

class AiPlanningService {
  /**
   * Generates a read-only daily planning draft.
   *
   * @param {string} userId Authenticated user identity
   * @param {object} [options] Client options (productDate, planningWindow, defaultTaskDurationMinutes)
   * @param {BaseAiProvider} [injectedProvider=null] Optional dependency-injected provider for testing
   * @returns {Promise<{ success: boolean, draft: object }>}
   */
  async generateDailyPlanningDraft(userId, options = {}, injectedProvider = null) {
    // 1. Assemble read-only planning context
    const context = await planningContextService.assembleContext(userId, options);

    // If there are no candidates, return an empty deterministic draft immediately
    if (!context.candidates || context.candidates.length === 0) {
      const draft = deterministicScheduler.buildDraft(context, null, {
        provider: "deterministic",
        model: null,
        aiAssistanceAvailable: false,
        fallbackReason: "No eligible uncompleted tasks or routines found for this date.",
      });
      return { success: true, draft };
    }

    // 2. Resolve provider (supports direct dependency injection for tests)
    let provider = injectedProvider;
    if (!provider) {
      const requestedProvider = options.provider || AI_CONFIG.defaultProvider;
      try {
        provider = getAiProvider(requestedProvider, {
          model: options.model,
          timeoutMs: options.timeoutMs,
        });
      } catch (providerInitErr) {
        const draft = deterministicScheduler.buildDraft(context, null, {
          provider: "deterministic-fallback",
          model: null,
          aiAssistanceAvailable: false,
          fallbackReason: providerInitErr.message,
        });
        return { success: true, draft };
      }
    }

    // 3. Attempt AI recommendation
    let aiRecommendation = null;
    let aiMetadata = {
      provider: provider.name,
      model: provider.model || null,
      aiAssistanceAvailable: true,
      fallbackReason: null,
    };

    try {
      aiRecommendation = await provider.generatePlanningRecommendation(context, {
        timeoutMs: options.timeoutMs,
        model: options.model,
      });

      if (
        !aiRecommendation ||
        typeof aiRecommendation !== "object" ||
        !Array.isArray(aiRecommendation.recommendedOrder)
      ) {
        throw new Error("AI provider returned invalid response structure (expected object with 'recommendedOrder' array)");
      }
    } catch (aiErr) {
      // Graceful fallback to deterministic schedule
      aiMetadata = {
        provider: "deterministic-fallback",
        model: provider.model || null,
        aiAssistanceAvailable: false,
        fallbackReason: aiErr.message || "AI provider unavailable or timed out",
      };
      aiRecommendation = null;
    }

    // 4. Build deterministic collision-free draft
    const draft = deterministicScheduler.buildDraft(context, aiRecommendation, aiMetadata);

    return {
      success: true,
      draft,
    };
  }
}

export const aiPlanningService = new AiPlanningService();
export default aiPlanningService;
