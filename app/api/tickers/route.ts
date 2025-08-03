import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge'

// Import the tickers data directly
import tickersData from '../../../tech_tickers.json';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ tickers: tickersData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to read tech tickers" }, { status: 500 });
  }
} 