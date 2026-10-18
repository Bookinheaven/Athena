export class BaseAiProvider {
  constructor(name = "base") {
    this.name = name;
  }

  /**
   * Generates task ordering and rationale recommendations based on a validated planning context.
   *
   * @param {object} planningContext Pre-assembled planning context with candidates and constraints.
   * @param {object} [options] Provider-specific options (timeout, temperature, etc.)
   * @returns {Promise<{
   *   recommendedOrder: Array<{
   *     targetType: "task" | "routine_occurrence",
   *     targetId: string,
   *     rationale?: string
   *   }>,
   *   overallReasoning?: string
   * }>}
   */
  async generatePlanningRecommendation(planningContext, options = {}) {
    throw new Error(`generatePlanningRecommendation must be implemented by ${this.name} provider`);
  }
}

export default BaseAiProvider;
