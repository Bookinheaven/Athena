import { BaseAiProvider } from "./baseProvider.js";
import { AI_CONFIG } from "../aiConfig.js";

export class OllamaProvider extends BaseAiProvider {
  constructor(options = {}) {
    super("ollama");
    this.baseUrl = (options.baseUrl || AI_CONFIG.ollama.baseUrl).replace(/\/+$/, "");
    this.model = options.model || AI_CONFIG.ollama.defaultModel;
    this.timeoutMs = Number(options.timeoutMs || AI_CONFIG.ollama.requestTimeoutMs);
  }

  /**
   * Builds the system prompt enforcing strict grounded JSON output.
   */
  _buildSystemPrompt() {
    return [
      "You are Athena's Daily Planning Assistant.",
      "Your sole task is to recommend an optimal focus execution order for a set of pre-validated candidates.",
      "CRITICAL CONSTRAINTS:",
      "1. You MUST ONLY select IDs that exist in the provided candidate list. NEVER invent or hallucinate task or routine IDs.",
      "2. You MUST NOT invent dates, timestamps, or new durations.",
      "3. Prioritize high-impact work, urgent/overdue deadlines, and routine anchors.",
      "4. Output MUST be valid JSON conforming strictly to the requested schema.",
      "5. Keep 'rationale' strictly under 10 words. Keep 'overallReasoning' strictly under 25 words.",
      "",
      'Schema: { "recommendedOrder": [ { "targetType": "task" | "routine_occurrence", "targetId": "<exact candidate id>", "rationale": "<brief reason under 10 words>" } ], "overallReasoning": "<summary under 25 words>" }',
    ].join("\n");
  }

  /**
   * Formats the planning context into a sanitized user prompt.
   * Private notes, passwords, and sensitive credentials are excluded.
   */
  _buildUserPrompt(planningContext) {
    const candidates = (planningContext.candidates || []).map((c) => ({
      id: c.id,
      type: c.targetType,
      title: c.title,
      priority: c.priority,
      durationMinutes: c.durationMinutes,
      isOverdue: Boolean(c.isOverdue),
      dueDate: c.dueDate || null,
      plannedDate: c.plannedProductDate || null,
      stepProgress: c.stepProgress || null,
    }));

    const occupied = (planningContext.occupiedIntervals || []).map((b) => ({
      title: b.title,
      start: b.formattedStart,
      end: b.formattedEnd,
      durationMinutes: b.durationMinutes,
    }));

    return JSON.stringify({
      productDate: planningContext.productDate,
      planningWindow: planningContext.planningWindow?.formattedRange || "09:00 – 17:00",
      availableMinutes: planningContext.planningWindow?.availableMinutes ?? 480,
      dailyTargetMinutes: planningContext.dailyFocusTargetMinutes ?? 25,
      occupiedTimeBlocks: occupied,
      candidates,
    });
  }

  async generatePlanningRecommendation(planningContext, options = {}) {
    const timeoutMs = Number(options.timeoutMs || this.timeoutMs);
    const model = options.model || this.model;
    const url = `${this.baseUrl}/api/chat`;

    const systemPrompt = this._buildSystemPrompt();
    const userPrompt = this._buildUserPrompt(planningContext);

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.1, // low temperature for consistent, deterministic ranking
        num_predict: 350, // concise output bound to guarantee fast inference
      },
    };

    let controller;
    let timeoutId;
    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Ollama returned HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const rawContent = data?.message?.content || data?.response;

      if (!rawContent || typeof rawContent !== "string") {
        throw new Error("Ollama returned empty response message");
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent.trim());
      } catch (jsonErr) {
        throw new Error(`Failed to parse Ollama JSON response: ${jsonErr.message}`);
      }

      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.recommendedOrder)) {
        throw new Error("Ollama output missing 'recommendedOrder' array");
      }

      return {
        recommendedOrder: parsed.recommendedOrder.filter(
          (item) => item && typeof item === "object" && item.targetId
        ),
        overallReasoning: parsed.overallReasoning || "AI recommended schedule order based on priorities and available intervals.",
      };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Ollama request timed out after ${timeoutMs}ms`);
        timeoutErr.code = "ETIMEDOUT";
        throw timeoutErr;
      }

      // Preserve network/connection error codes (e.g. ECONNREFUSED)
      throw err;
    }
  }
}

export default OllamaProvider;
