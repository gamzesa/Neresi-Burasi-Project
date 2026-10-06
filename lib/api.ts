import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { GameError } from "@/lib/game/service";

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof GameError) return errorResponse(error.status, error.message);
  console.error(error);
  return errorResponse(500, "Beklenmeyen bir hata oluştu.");
}

function invalidInput(issues: { message: string }[]) {
  return errorResponse(400, issues[0]?.message ?? "Geçersiz istek.");
}

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

/** JSON gövdeyi Zod ile doğrular, ardından işleyiciyi çalıştırır. Hatalar Türkçe mesajla döner. */
export function postRoute<T>(schema: ZodType<T>, handler: (input: T) => Promise<unknown>) {
  return async (request: Request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "İstek gövdesi geçerli bir JSON değil.");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return invalidInput(parsed.error.issues);
    try {
      return NextResponse.json(await handler(parsed.data), NO_STORE);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function getRoute<T>(schema: ZodType<T>, handler: (input: T) => Promise<unknown>) {
  return async (request: Request) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = schema.safeParse(params);
    if (!parsed.success) return invalidInput(parsed.error.issues);
    try {
      return NextResponse.json(await handler(parsed.data), NO_STORE);
    } catch (error) {
      return handleError(error);
    }
  };
}
