import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  temperature?: number;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = (apiKeyOverride?: string) => {
  // Use Google's endpoint when a Gemini key is available (user-supplied or Railway env var)
  if (apiKeyOverride || ENV.geminiApiKey) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
};

const assertApiKey = (apiKeyOverride?: string) => {
  if (!apiKeyOverride && !ENV.geminiApiKey && !ENV.forgeApiKey) {
    throw new Error("No LLM API key configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(
  params: InvokeParams,
  options?: {
    apiKey?: string;        // Gemini own key
    model?: string;
    openaiApiKey?: string;  // OpenAI key
    claudeApiKey?: string;  // Anthropic key
    groqApiKey?: string;    // Groq key (Llama, Qwen)
    mistralApiKey?: string; // Mistral key
  }
): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const model = options?.model ?? (options?.apiKey ? "gemini-2.0-flash" : "gemini-2.5-flash");
  const isOpenAI   = /^(gpt-|o1-|o3-)/.test(model);
  const isClaude   = model.startsWith("claude-");
  const isGroq     = /^(llama-|qwen|gemma|mixtral)/.test(model);
  const isMistral  = /^(mistral-|codestral-|open-mixtral-)/.test(model);

  // ── OpenAI path ───────────────────────────────────────────────
  if (isOpenAI) {
    const openaiKey = options?.openaiApiKey;
    if (!openaiKey) {
      throw new Error(`OpenAI API key required for model "${model}". Add it in Settings → API Keys.`);
    }

    const normalizedResponseFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
    // OpenAI strict json_schema requires every property in `required`; downgrade to json_object
    const oaiFormat = normalizedResponseFormat?.type === "json_schema"
      ? { type: "json_object" as const }
      : normalizedResponseFormat;

    const oaiPayload: Record<string, unknown> = {
      model,
      messages: messages.map(normalizeMessage),
      max_tokens: params.maxTokens ?? params.max_tokens ?? 4096,
    };
    if (params.temperature !== undefined) oaiPayload.temperature = params.temperature;
    if (tools && tools.length > 0) oaiPayload.tools = tools;
    const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
    if (normalizedToolChoice) oaiPayload.tool_choice = normalizedToolChoice;
    if (oaiFormat) oaiPayload.response_format = oaiFormat;

    const oaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify(oaiPayload),
    });
    if (!oaiResponse.ok) {
      const errorText = await oaiResponse.text();
      throw new Error(`LLM invoke failed: ${oaiResponse.status} ${oaiResponse.statusText} – ${errorText}`);
    }
    return (await oaiResponse.json()) as InvokeResult;
  }

  // ── Anthropic / Claude path ───────────────────────────────────
  if (isClaude) {
    const claudeKey = options?.claudeApiKey;
    if (!claudeKey) {
      throw new Error(`Anthropic API key required for model "${model}". Add it in Settings → API Keys.`);
    }

    // Anthropic separates system message from the messages array
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    const normalizedResponseFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
    let systemText = systemMsg
      ? typeof systemMsg.content === "string" ? systemMsg.content : JSON.stringify(systemMsg.content)
      : "";
    // Anthropic doesn't support response_format; inject JSON instruction into system prompt instead
    if (normalizedResponseFormat?.type === "json_schema" || normalizedResponseFormat?.type === "json_object") {
      systemText += "\n\nRespond with valid JSON only. No markdown fences, no explanation.";
    }

    const claudePayload: Record<string, unknown> = {
      model,
      max_tokens: params.maxTokens ?? params.max_tokens ?? 4096,
      messages: nonSystemMsgs.map(normalizeMessage),
    };
    if (systemText) claudePayload.system = systemText;
    if (params.temperature !== undefined) claudePayload.temperature = params.temperature;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": claudeKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudePayload),
    });
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`LLM invoke failed: ${claudeResponse.status} ${claudeResponse.statusText} – ${errorText}`);
    }
    const claudeData = (await claudeResponse.json()) as {
      id: string;
      content: Array<{ type: string; text: string }>;
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
      stop_reason?: string;
    };
    const content = claudeData.content?.find((c) => c.type === "text")?.text ?? "";
    return {
      id: claudeData.id,
      created: Math.floor(Date.now() / 1000),
      model: claudeData.model,
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: claudeData.stop_reason ?? "stop" }],
      usage: claudeData.usage ? {
        prompt_tokens: claudeData.usage.input_tokens,
        completion_tokens: claudeData.usage.output_tokens,
        total_tokens: claudeData.usage.input_tokens + claudeData.usage.output_tokens,
      } : undefined,
    };
  }

  // ── Groq path (Llama, Qwen — OpenAI-compatible) ───────────────
  if (isGroq) {
    const groqKey = options?.groqApiKey;
    if (!groqKey) {
      throw new Error(`Groq API key required for model "${model}". Add it in Settings → API Keys.`);
    }
    const normalizedResponseFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
    const groqFormat = normalizedResponseFormat?.type === "json_schema"
      ? { type: "json_object" as const }
      : normalizedResponseFormat;
    const groqPayload: Record<string, unknown> = {
      model,
      messages: messages.map(normalizeMessage),
      max_tokens: params.maxTokens ?? params.max_tokens ?? 4096,
    };
    if (params.temperature !== undefined) groqPayload.temperature = params.temperature;
    if (groqFormat) groqPayload.response_format = groqFormat;
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${groqKey}` },
      body: JSON.stringify(groqPayload),
    });
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`LLM invoke failed: ${groqResponse.status} ${groqResponse.statusText} – ${errorText}`);
    }
    return (await groqResponse.json()) as InvokeResult;
  }

  // ── Mistral path (OpenAI-compatible) ─────────────────────────
  if (isMistral) {
    const mistralKey = options?.mistralApiKey;
    if (!mistralKey) {
      throw new Error(`Mistral API key required for model "${model}". Add it in Settings → API Keys.`);
    }
    const normalizedResponseFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
    const mistralFormat = normalizedResponseFormat?.type === "json_schema"
      ? { type: "json_object" as const }
      : normalizedResponseFormat;
    const mistralPayload: Record<string, unknown> = {
      model,
      messages: messages.map(normalizeMessage),
      max_tokens: params.maxTokens ?? params.max_tokens ?? 4096,
    };
    if (params.temperature !== undefined) mistralPayload.temperature = params.temperature;
    if (mistralFormat) mistralPayload.response_format = mistralFormat;
    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${mistralKey}` },
      body: JSON.stringify(mistralPayload),
    });
    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      throw new Error(`LLM invoke failed: ${mistralResponse.status} ${mistralResponse.statusText} – ${errorText}`);
    }
    return (await mistralResponse.json()) as InvokeResult;
  }

  // ── Gemini path ───────────────────────────────────────────────
  // Priority: caller-supplied key → Railway GEMINI_API_KEY → Forge key
  const resolvedApiKey = options?.apiKey || ENV.geminiApiKey || ENV.forgeApiKey;
  assertApiKey(resolvedApiKey);

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 32768;
  if (params.temperature !== undefined) {
    payload.temperature = params.temperature;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(options?.apiKey), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolvedApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
