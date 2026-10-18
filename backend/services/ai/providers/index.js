import { MockProvider } from "./mockProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";
import { AI_CONFIG } from "../aiConfig.js";

const providerInstances = new Map();

/**
 * Returns an instance of the requested AI provider, or the default configured provider.
 *
 * @param {string} [providerName] "mock" | "ollama"
 * @param {object} [options] Provider-specific options
 * @returns {BaseAiProvider}
 */
export function getAiProvider(providerName = null, options = {}) {
  const selectedName = (providerName || AI_CONFIG.defaultProvider).toLowerCase().trim();

  if (selectedName === "mock") {
    if (!providerInstances.has("mock")) {
      providerInstances.set("mock", new MockProvider(options));
    }
    return providerInstances.get("mock");
  }

  if (selectedName === "ollama") {
    const hasConfigOptions = Boolean(options.model || options.timeoutMs || options.baseUrl);
    if (!providerInstances.has("ollama") || hasConfigOptions) {
      providerInstances.set("ollama", new OllamaProvider(options));
    }
    return providerInstances.get("ollama");
  }

  throw new Error(`Unsupported AI provider: '${selectedName}'. Allowed providers: 'ollama', 'mock'`);
}

export { MockProvider, OllamaProvider };
export default getAiProvider;
