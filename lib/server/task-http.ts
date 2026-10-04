import "server-only";

export function taskResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readTaskBody(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) ||
      request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new Error("Invalid request origin or content type");
  }
  return request.json();
}
