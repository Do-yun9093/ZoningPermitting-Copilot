// Single shared Groq client. All LLM calls go through here.
// If GROQ_API_KEY is missing, callers fall back to demo responses so the
// prototype is still walkable for UI reviews.

const OpenAI = require("openai");

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const endpoint =
  process.env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";

const client = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;

function isLive() {
  return Boolean(client);
}

/**
 * chat({ system, user, temperature })
 * Returns { text, demo } — demo=true means the key was missing and a
 * canned response was returned so the UI still renders.
 */
async function chat({ system, user, temperature = 0.2 }) {
  if (!client) {
    return {
      demo: true,
      text:
        "Demo mode — no GROQ_API_KEY configured. " +
        "Add one to server/.env to enable live LLM answers."
    };
  }
  const resp = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: user }
    ]
  });
  return {
    demo: false,
    text: resp.choices?.[0]?.message?.content?.trim() || ""
  };
}

module.exports = { chat, isLive, model };
