import { evaluateFlag } from "@/lib/evaluation/engine";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const { key } = await params;

  const isEnabled = await evaluateFlag(key, userId);

  return NextResponse.json({ key, isEnabled });
}
