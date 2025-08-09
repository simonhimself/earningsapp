import { NextRequest, NextResponse } from "next/server"
import techTickers from "../../../tech_tickers.json"

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

export const runtime = 'edge' // Added for Cloudflare Pages Edge Runtime

export async function GET(req: NextRequest) {
  try {
    // Use imported tech tickers for filtering
    const techSymbols = new Set(techTickers.map((t: any) => t.symbol))
    
    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // Today in YYYY-MM-DD format
    
    console.log("[API] /api/earnings-today date:", todayStr)

    const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${todayStr}&to=${todayStr}&token=${FINNHUB_API_KEY}`

    const res = await fetch(url)
    if (!res.ok) {
      console.error("[API] Finnhub fetch failed:", res.status, res.statusText)
      return NextResponse.json({ error: "Failed to fetch from Finnhub" }, { status: 500 })
    }
    
    const data = await res.json()
    console.log("[API] Finnhub response received, processing...")

    let earnings = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
    
    // Filter for tech stocks and process
    const techEarnings = earnings.filter((e: any) => techSymbols.has(e.symbol))
    console.log(`[API] Filtered ${techEarnings.length} tech earnings from ${earnings.length} total earnings`)
    
    const result = techEarnings.map((e: any) => {
      const actual = typeof e.epsActual === "number" ? e.epsActual : (e.epsActual ? parseFloat(e.epsActual) : null)
      const estimate = typeof e.epsEstimate === "number" ? e.epsEstimate : (e.epsEstimate ? parseFloat(e.epsEstimate) : null)
      let surprise = null
      let surprisePercent = null
      if (actual !== null && estimate !== null && !isNaN(actual) && !isNaN(estimate)) {
        surprise = actual - estimate
        surprisePercent = estimate !== 0 ? ((actual - estimate) / Math.abs(estimate)) * 100 : null
      }
      
      // Get additional info from tech tickers
      const techTicker = techTickers.find((t: any) => t.symbol === e.symbol)
      
      return {
        symbol: e.symbol,
        date: e.date,
        actual,
        estimate,
        surprise,
        surprisePercent,
        hour: e.hour,
        quarter: e.quarter,
        year: e.year,
        exchange: techTicker?.exchange || null,
        description: techTicker?.description || null
      }
    })

    // Sort by symbol for consistent ordering
    const sortedResult = result.sort((a, b) => a.symbol.localeCompare(b.symbol))

    console.log(`[API] Found ${sortedResult.length} earnings records for today`)
    return NextResponse.json({ 
      earnings: sortedResult,
      date: todayStr,
      totalFound: sortedResult.length
    })
  } catch (error) {
    console.error("[API] Error fetching today's earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
