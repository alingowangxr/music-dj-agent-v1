import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const systemPrompt = readFileSync(
  join(__dirname, "prompts", "dj-system.txt"),
  "utf-8"
)

type Provider = "openai" | "deepseek" | "gemini" | "local"

export interface DJResponse {
  say: string
  search: string
}

function getConfig() {
  const provider = (process.env.LLM_PROVIDER || "openai") as Provider
  const model = process.env.LLM_MODEL || defaultModel(provider)
  return { provider, model }
}

function defaultModel(p: Provider): string {
  switch (p) {
    case "openai":   return "gpt-4o-mini"
    case "deepseek": return "deepseek-chat"
    case "gemini":   return "gemini-2.0-flash"
    case "local":    return ""
  }
}

function supportsJsonMode(p: Provider): boolean {
  return p === "openai" || p === "deepseek"
}

function parseDJResponse(text: string): DJResponse {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1").trim()
    return JSON.parse(cleaned) as DJResponse
  } catch (err) {
    console.error("[LLM] Failed to parse JSON:", text)
    // Fallback if parsing fails but there's a "say" part
    return {
      say: "聽起來不錯，我找找看...",
      search: text.substring(0, 50)
    }
  }
}

async function callOpenAICompatible(
  message: string,
  baseURL: string,
  apiKey: string,
): Promise<DJResponse> {
  const { provider, model } = getConfig()
  const client = new OpenAI({ baseURL, apiKey })

  const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.7,
  }

  if (supportsJsonMode(provider)) {
    params.response_format = { type: "json_object" }
  }

  const response = await client.chat.completions.create(params)
  const text = response.choices[0].message.content || "{}"
  return parseDJResponse(text)
}

async function callGemini(message: string): Promise<DJResponse> {
  const { model } = getConfig()
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
  const genModel = genAI.getGenerativeModel({ model })

  const result = await genModel.generateContent({
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n使用者說：${message}\n\n請輸出 JSON，不要包含其他文字` }] },
    ],
    generationConfig: {
      temperature: 0.7,
    },
  })

  const text = result.response.text()
  return parseDJResponse(text)
}

export async function generateDJResponse(message: string): Promise<DJResponse> {
  const { provider } = getConfig()
  switch (provider) {
    case "deepseek":
      return callOpenAICompatible(message, "https://api.deepseek.com/v1", process.env.OPENAI_API_KEY || "")
    case "local": {
      const baseURL = process.env.LLM_BASE_URL || "http://localhost:11434/v1"
      return callOpenAICompatible(message, baseURL, process.env.LLM_API_KEY || "noop")
    }
    case "gemini":
      return callGemini(message)
    default:
      return callOpenAICompatible(message, "https://api.openai.com/v1", process.env.OPENAI_API_KEY || "")
  }
}

export function getCurrentProvider() {
  return getConfig()
}
