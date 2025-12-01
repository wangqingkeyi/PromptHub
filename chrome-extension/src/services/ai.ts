/**
 * AI Service - Call various AI model APIs
 * Most providers are compatible with OpenAI format
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  type?: 'chat' | 'image';
}

export interface AITestResult {
  success: boolean;
  response?: string;
  error?: string;
  latency?: number;
  model: string;
  provider: string;
}

// Anthropic API version - this may need to be updated as the API evolves
const ANTHROPIC_API_VERSION = '2023-06-01';

/**
 * Chat completion with AI model
 */
export async function chatCompletion(
  config: AIConfig,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const { provider, apiKey, apiUrl, model } = config;
  
  if (!apiKey) {
    throw new Error('Please configure API Key first');
  }
  
  if (!apiUrl) {
    throw new Error('Please configure API URL first');
  }
  
  if (!model) {
    throw new Error('Please select a model first');
  }

  // Build request URL
  let endpoint = apiUrl;
  if (!endpoint.endsWith('/chat/completions')) {
    endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Different auth methods for providers
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = ANTHROPIC_API_VERSION;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Build request body
  const body: ChatCompletionRequest = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: false,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText.slice(0, 200);
        }
      }
      throw new Error(errorMessage);
    }

    const data: ChatCompletionResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('AI returned empty result');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed, please check connection');
  }
}

/**
 * Test AI connection
 */
export async function testAIConnection(
  config: AIConfig,
  testPrompt?: string
): Promise<AITestResult> {
  const startTime = Date.now();
  const prompt = testPrompt || 'Hello! Please respond with a brief greeting.';
  
  try {
    const result = await chatCompletion(config, [
      { role: 'user', content: prompt }
    ], { maxTokens: 100 });
    
    return {
      success: true,
      response: result,
      latency: Date.now() - startTime,
      model: config.model,
      provider: config.provider,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime,
      model: config.model,
      provider: config.provider,
    };
  }
}

export interface MultiModelCompareResult {
  messages: ChatMessage[];
  results: AITestResult[];
  totalTime: number;
}

/**
 * Multi-model comparison
 */
export async function multiModelCompare(
  configs: AIConfig[],
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<MultiModelCompareResult> {
  const startTime = Date.now();
  
  const promises = configs.map(async (config) => {
    const resultStartTime = Date.now();
    try {
      const response = await chatCompletion(config, messages, options);
      
      return {
        success: true,
        response,
        latency: Date.now() - resultStartTime,
        model: config.model,
        provider: config.provider,
      } as AITestResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - resultStartTime,
        model: config.model,
        provider: config.provider,
      } as AITestResult;
    }
  });
  
  const results = await Promise.all(promises);
  
  return {
    messages,
    results,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Build messages from prompt template
 */
export function buildMessagesFromPrompt(
  systemPrompt: string | undefined,
  userPrompt: string,
  variables?: Record<string, string>
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  // Replace variables
  let processedUserPrompt = userPrompt;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      processedUserPrompt = processedUserPrompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value
      );
    }
  }
  
  if (systemPrompt) {
    let processedSystemPrompt = systemPrompt;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        processedSystemPrompt = processedSystemPrompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          value
        );
      }
    }
    messages.push({ role: 'system', content: processedSystemPrompt });
  }
  
  messages.push({ role: 'user', content: processedUserPrompt });
  
  return messages;
}
