import { getFlag } from "@/lib/evaluation/engine";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const key = params.key;

  const isEnabled = await getFlag(key, userId);

  return NextResponse.json({ key, isEnabled });
}
