import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    // Load tech tickers for filtering
    const techTickersFile = await fs.readFile("tech_tickers.json", "utf-8")
    const techTickers = JSON.parse(techTickersFile)
    const techSymbols = new Set(techTickers.map((t: any) => t.symbol))
    
    // Calculate next 30 days
    const today = new Date()
    const fromDate = today.toISOString().split('T')[0] // Today in YYYY-MM-DD format
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    const toDate = thirtyDaysFromNow.toISOString().split('T')[0] // 30 days from now
    
    console.log("[API] /api/earnings-next-30-days date range:", { fromDate, toDate })

    const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`

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

    console.log(`[API] Found ${result.length} earnings records for next 30 days`)
    return NextResponse.json({ 
      earnings: result,
      dateRange: { from: fromDate, to: toDate },
      totalFound: result.length
    })
  } catch (error) {
    console.error("[API] Error fetching next 30 days earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 