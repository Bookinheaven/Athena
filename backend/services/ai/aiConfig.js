export const AI_CONFIG = Object.freeze({
  // Default provider: "ollama" in production/dev, can be set to "mock" for testing
  defaultProvider: process.env.AI_PROVIDER || "ollama",

  // Local Ollama configuration
  // Installed models: qwen2.5-coder:7b (primary planning model), qwen2.5:0.5b
  ollama: Object.freeze({
    baseUrl: (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
    defaultModel: process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 45000,
    temperature: 0.1, // Low temperature for deterministic, consistent candidate ranking
  }),

  // Planning constraints
  planning: Object.freeze({
    defaultTaskDurationMinutes: 30,
    minTaskDurationMinutes: 5,
    maxTaskDurationMinutes: 240,
    maxOverdueTasksBound: 10,
    maxTotalCandidates: 25,
    defaultPlanningWindow: Object.freeze({
      startTime: "09:00",
      endTime: "17:00",
    }),
  }),
});

export default AI_CONFIG;
