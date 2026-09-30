import {
  captureInstructions,
  captureSchema,
  MAX_CAPTURE_LENGTH,
  parseCaptureRequest,
  parseCaptureResponse,
} from "@/lib/capture";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let capture: string;
  try {
    capture = parseCaptureRequest(await request.json());
  } catch {
    return error(`Send a nonblank capture of at most ${MAX_CAPTURE_LENGTH} characters.`, 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return error("Capture interpretation is unavailable. Please try again later or add a task manually.", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        reasoning: { effort: "low" },
        store: false,
        instructions: captureInstructions,
        input: [{ role: "user", content: [{ type: "input_text", text: capture }] }],
        text: { format: { type: "json_schema", name: "capture_interpretation", strict: true, schema: captureSchema } },
      }),
    });
    if (!response.ok) throw new Error("Upstream failure");
    return Response.json(parseCaptureResponse(await response.json()));
  } catch {
    return error(
      "Could not interpret this capture. Nothing was added. Please retry or add a task manually.",
      controller.signal.aborted ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
