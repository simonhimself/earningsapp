import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

// Test tickers we want to check for earnings
const TEST_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"]

export async function GET(req: NextRequest) {
  try {
    // Test a broader range: 1 month historical + rest of 2025
    const fromDate = "2025-07-01"
    const toDate = "2025-12-31"
    
    console.log("[API] Fetching upcoming earnings for test tickers:", TEST_TICKERS)
    console.log("[API] Date range:", fromDate, "to", toDate)

    // Fetch earnings calendar for the date range
    const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
    
    const res = await fetch(url)
    if (!res.ok) {
      console.error("[API] Finnhub fetch failed:", res.status, res.statusText)
      return NextResponse.json({ error: "Failed to fetch from Finnhub" }, { status: 500 })
    }
    
    const data = await res.json()
    console.log("[API] Finnhub response received, processing...")
    
    let earnings = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
    
    // Filter for our test tickers and get the next earnings date for each
    const upcomingEarnings = TEST_TICKERS.map(symbol => {
      const symbolEarnings = earnings.filter((e: any) => e.symbol === symbol)
      
      if (symbolEarnings.length > 0) {
        // Get the earliest (next) earnings date for this symbol
        const nextEarnings = symbolEarnings.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0]
        
        return {
          symbol: symbol,
          date: nextEarnings.date,
          hour: nextEarnings.hour, // amc (after market close) or bmo (before market open)
          quarter: nextEarnings.quarter,
          year: nextEarnings.year
        }
      } else {
        // No earnings found for this symbol in the date range
        return {
          symbol: symbol,
          date: null,
          hour: null,
          quarter: null,
          year: null
        }
      }
    })
    
    console.log("[API] Processed upcoming earnings:", upcomingEarnings)
    
    return NextResponse.json({ 
      upcomingEarnings,
      dateRange: { from: fromDate, to: toDate },
      totalFound: upcomingEarnings.filter(e => e.date !== null).length
    })
    
  } catch (error) {
    console.error("[API] Error fetching upcoming earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 