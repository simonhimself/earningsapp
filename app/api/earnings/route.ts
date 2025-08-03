import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d1qeun9r01qrh89pu1tgd1qeun9r01qrh89pu1u0"
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")
  const year = searchParams.get("year")
  const quarter = searchParams.get("quarter")

  // Log incoming query parameters
  console.log("[API] /api/earnings query params:", { symbol, year, quarter })

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 })
  }

  // Calculate date range based on year and quarter
  let fromDate = ""
  let toDate = ""
  
  if (year) {
    if (quarter) {
      // Specific quarter
      const quarterStart = {
        1: "01-01",
        2: "04-01", 
        3: "07-01",
        4: "10-01"
      }[quarter]
      const quarterEnd = {
        1: "03-31",
        2: "06-30",
        3: "09-30", 
        4: "12-31"
      }[quarter]
      fromDate = `${year}-${quarterStart}`
      toDate = `${year}-${quarterEnd}`
    } else {
      // Full year
      fromDate = `${year}-01-01`
      toDate = `${year}-12-31`
    }
  }

  // Use Finnhub earnings calendar endpoint
  const url = `${FINNHUB_BASE_URL}/calendar/earnings?symbol=${encodeURIComponent(symbol)}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}&token=${FINNHUB_API_KEY}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("[API] Finnhub fetch failed:", res.status, res.statusText)
      return NextResponse.json({ error: "Failed to fetch from Finnhub" }, { status: 500 })
    }
    const data = await res.json()
    // Log raw Finnhub response
    console.log("[API] Finnhub response:", JSON.stringify(data, null, 2))
    let earnings = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
    // Map to relevant fields and calculate surprise fields
    const result = earnings.map((e: any) => {
      const actual = typeof e.epsActual === "number" ? e.epsActual : (e.epsActual ? parseFloat(e.epsActual) : null)
      const estimate = typeof e.epsEstimate === "number" ? e.epsEstimate : (e.epsEstimate ? parseFloat(e.epsEstimate) : null)
      let surprise = null
      let surprisePercent = null
      if (actual !== null && estimate !== null && !isNaN(actual) && !isNaN(estimate)) {
        surprise = actual - estimate
        surprisePercent = estimate !== 0 ? ((actual - estimate) / Math.abs(estimate)) * 100 : null
      }
      return {
        symbol: e.symbol,
        date: e.date,
        actual,
        estimate,
        surprise,
        surprisePercent,
      }
    })
    return NextResponse.json({ earnings: result })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 