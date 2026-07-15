import { env } from "../../config/env";

const PROMPTS: Record<string, string> = {
  summarize:
    "Summarize the following document in 3-5 concise bullet points. Only output the bullet points, nothing else.",
  fix_grammar:
    "Fix grammar, spelling, and punctuation in the following text. Preserve the original meaning and tone. Only output the corrected text, no explanations.",
  continue_writing:
    "Continue writing the following document naturally, matching its tone and style. Write 2-3 new paragraphs only. Only output the new continuation, not the original text.",
};

export async function runAiAssist(action: string, text: string) {
  const prompt = PROMPTS[action];
  if (!prompt) throw { status: 400, message: "Unsupported action" };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw { status: 502, message: `AI provider error: ${errBody.slice(0, 200)}` };
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;
  if (!result) throw { status: 502, message: "AI provider returned no content" };

  return { result };
}