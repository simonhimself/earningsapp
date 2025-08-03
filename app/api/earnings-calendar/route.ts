import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d1qeun9r01qrh89pu1tgd1qeun9r01qrh89pu1u0"
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year")
  const quarter = searchParams.get("quarter")

  console.log("[API] /api/earnings-calendar query params:", { year, quarter })

  if (!year) {
    return NextResponse.json({ error: "Missing year parameter" }, { status: 400 })
  }

  // Calculate date range based on year and quarter
  let fromDate = ""
  let toDate = ""
  
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

  const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("[API] Finnhub fetch failed:", res.status, res.statusText)
      return NextResponse.json({ error: "Failed to fetch from Finnhub" }, { status: 500 })
    }
    const data = await res.json()
    console.log("[API] Finnhub response received, processing...")

    let earnings = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
    
    // Filter for tech stocks only (we'll need to check against our tech tickers list)
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

    console.log(`[API] Found ${result.length} earnings records for ${fromDate} to ${toDate}`)
    return NextResponse.json({ earnings: result })
  } catch (error) {
    console.error("[API] Error fetching earnings calendar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 