import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

const OUTPUT_FILE = "tech_tickers_test.json";

export async function GET(req: NextRequest) {
  try {
    const file = await fs.readFile(OUTPUT_FILE, "utf-8");
    const tickers = JSON.parse(file);
    return NextResponse.json({ tickers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to read tech tickers" }, { status: 500 });
  }
} 