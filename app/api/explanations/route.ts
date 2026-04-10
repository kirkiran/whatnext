import { generateLocalExplanations } from "@/lib/explanations";
import type { ExplanationInput, ExplanationOutput } from "@/lib/explanations";

export async function POST(request: Request) {
  const input = (await request.json()) as ExplanationInput;

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(generateLocalExplanations(input));
  }

  try {
    const aiExplanations = await generateAiExplanations(input);
    return Response.json(aiExplanations);
  } catch {
    return Response.json(generateLocalExplanations(input));
  }
}

async function generateAiExplanations(
  input: ExplanationInput,
): Promise<ExplanationOutput> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "recommendation_explanations",
          schema: {
            type: "object",
            properties: {
              primaryExplanation: { type: "string" },
              backupExplanation: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
            },
            required: ["primaryExplanation", "backupExplanation"],
            additionalProperties: false,
          },
        },
      },
      instructions:
        "You explain already-selected tasks for a parent support app. Do not choose tasks or change decisions. Write short, warm, practical explanations in plain English. Mention only the provided facts.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Explain these already-selected recommendation results:\n${JSON.stringify(
                input,
                null,
                2,
              )}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI explanation request failed");
  }

  const data = await response.json();
  const parsedOutput = JSON.parse(data.output_text) as {
    primaryExplanation: string;
    backupExplanation: string | null;
  };

  return {
    primaryExplanation: parsedOutput.primaryExplanation,
    backupExplanation: parsedOutput.backupExplanation,
    source: "ai",
  };
}
