"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Building2, Info, ChevronUp, ChevronDown } from "lucide-react"


// Mock data for demonstration
// const mockEarnings = [
//   { symbol: "AAPL", exchange: "NASDAQ", date: "2024-01-25", eps: "2.18", estimate: "2.10", surprise: "+3.8%" },
//   { symbol: "MSFT", exchange: "NASDAQ", date: "2024-01-24", eps: "2.93", estimate: "2.78", surprise: "+5.4%" },
//   { symbol: "GOOGL", exchange: "NASDAQ", date: "2024-01-23", eps: "1.64", estimate: "1.59", surprise: "+3.1%" },
//   { symbol: "AMZN", exchange: "NASDAQ", date: "2024-01-22", eps: "1.00", estimate: "0.80", surprise: "+25.0%" },
//   { symbol: "TSLA", exchange: "NASDAQ", date: "2024-01-21", eps: "0.71", estimate: "0.73", surprise: "-2.7%" },
// ]

type ViewState = "loading" | "data" | "empty"

type SortField = "symbol" | "exchange" | "date" | "actual" | "estimate" | "surprise" | "surprisePercent"
type SortDirection = "asc" | "desc" | null

function SortIcon({
  field,
  currentField,
  direction,
}: { field: SortField; currentField: SortField | null; direction: SortDirection }) {
  if (currentField !== field) {
    return <ChevronUp className="w-4 h-4 text-gray-300" />
  }

  if (direction === "asc") {
    return <ChevronUp className="w-4 h-4 text-gray-600" />
  } else if (direction === "desc") {
    return <ChevronDown className="w-4 h-4 text-gray-600" />
  }

  return <ChevronUp className="w-4 h-4 text-gray-300" />
}

export function EarningsDashboard() {
  const [viewState, setViewState] = useState<ViewState>("data")
  // Helper function to get current quarter and year
  const getCurrentQuarter = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
    
    let currentQuarter
    if (currentMonth >= 1 && currentMonth <= 3) currentQuarter = "1"
    else if (currentMonth >= 4 && currentMonth <= 6) currentQuarter = "2"
    else if (currentMonth >= 7 && currentMonth <= 9) currentQuarter = "3"
    else currentQuarter = "4"
    
    return { year: currentYear.toString(), quarter: currentQuarter }
  }

  const currentPeriod = getCurrentQuarter()
  const [ticker, setTicker] = useState("")
  const [year, setYear] = useState(currentPeriod.year)
  const [quarter, setQuarter] = useState(currentPeriod.quarter)
  const [earnings, setEarnings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [techTickers, setTechTickers] = useState<any[]>([])

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)
  const [activePeriod, setActivePeriod] = useState<"next30" | "previous30" | "search">("next30")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or reset
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortedEarnings = () => {
    let filtered = earnings
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = a[sortField]
        let bValue: string | number = b[sortField]
        if (sortField === "actual" || sortField === "estimate" || sortField === "surprise" || sortField === "surprisePercent") {
          aValue = Number(aValue)
          bValue = Number(bValue)
        } else if (sortField === "date") {
          aValue = new Date(aValue as string).getTime()
          bValue = new Date(bValue as string).getTime()
        }
        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }
    return filtered
  }

  const handleSearch = async () => {
    setIsSearchMode(true)
    setViewState("loading")
    setError(null)
    setActivePeriod("search")
    
          try {
        if (ticker.trim()) {
          // Search for specific ticker
          const params = new URLSearchParams()
          params.append("symbol", ticker.trim())
          if (year) params.append("year", year)
          if (quarter) params.append("quarter", quarter)
          const res = await fetch(`/api/earnings?${params.toString()}`)
          if (!res.ok) throw new Error("Failed to fetch earnings data")
          const data = await res.json()
          let earnings = Array.isArray(data.earnings) ? data.earnings : []
          if (earnings && earnings.length > 0) {
            // Add exchange information from tech tickers data
            const enrichedEarnings = earnings.map((earning: any) => {
              const techTicker = techTickers.find((t: any) => t.symbol === earning.symbol)
              return {
                ...earning,
                exchange: techTicker?.exchange || "N/A",
                description: techTicker?.description || ""
              }
            })
            setEarnings(enrichedEarnings)
            setViewState("data")
          } else {
            setEarnings([])
            setViewState("empty")
          }
        } else {
          // Search for all tech tickers in the selected period
          const allTickerSymbols = techTickers.map((t: any) => t.symbol)
          const allEarnings: any[] = []
          
          // Process in batches to avoid overwhelming the API
          const BATCH_SIZE = 10
          for (let i = 0; i < allTickerSymbols.length; i += BATCH_SIZE) {
            const batch = allTickerSymbols.slice(i, i + BATCH_SIZE)
            
            // Process batch in parallel with rate limiting
            const batchPromises = batch.map(async (symbol: string) => {
              const params = new URLSearchParams()
              params.append("symbol", symbol)
              if (year) params.append("year", year)
              if (quarter) params.append("quarter", quarter)
              
              const res = await fetch(`/api/earnings?${params.toString()}`)
              if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data.earnings) && data.earnings.length > 0) {
                  return data.earnings
                }
              }
              return []
            })
            
            const batchResults = await Promise.all(batchPromises)
            batchResults.forEach(earnings => allEarnings.push(...earnings))
            
            // Delay between batches to respect API limits
            if (i + BATCH_SIZE < allTickerSymbols.length) {
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          }
          
          if (allEarnings.length > 0) {
            // Add exchange information from tech tickers data
            const enrichedEarnings = allEarnings.map((earning: any) => {
              const techTicker = techTickers.find((t: any) => t.symbol === earning.symbol)
              return {
                ...earning,
                exchange: techTicker?.exchange || "N/A",
                description: techTicker?.description || ""
              }
            })
            setEarnings(enrichedEarnings)
            setViewState("data")
          } else {
            setEarnings([])
            setViewState("empty")
          }
        }
    } catch (err: any) {
      setError(err.message || "Unknown error")
      setEarnings([])
      setViewState("empty")
    }
  }

  const clearSearch = () => {
    setIsSearchMode(false)
    setTicker("")
    setError(null)
    setActivePeriod("next30")
    loadNext30Days()
  }

  const loadNext30Days = async () => {
    setViewState("loading")
    setError(null)
    setActivePeriod("next30")
    setIsSearchMode(false)
    
    try {
      const res = await fetch("/api/earnings-next-30-days")
      if (!res.ok) throw new Error("Failed to fetch earnings data")
      const data = await res.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Unknown error")
      setEarnings([])
      setViewState("empty")
    }
  }

  const loadPrevious30Days = async () => {
    setViewState("loading")
    setError(null)
    setActivePeriod("previous30")
    setIsSearchMode(false)
    
    try {
      const res = await fetch("/api/earnings-previous-30-days")
      if (!res.ok) throw new Error("Failed to fetch earnings data")
      const data = await res.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Unknown error")
      setEarnings([])
      setViewState("empty")
    }
  }

  useEffect(() => {
    // On mount, load next 30 days of tech earnings by default
    (async () => {
      setViewState("loading")
      setError(null)
      try {
        // First fetch tech tickers to get exchange information
        const tickersRes = await fetch("/api/tickers")
        if (!tickersRes.ok) throw new Error("Failed to fetch tickers")
        const tickersData = await tickersRes.json()
        
        if (tickersData.tickers && tickersData.tickers.length > 0) {
          // Store tech tickers for reference
          const mappedTickers = tickersData.tickers.map((t: any) => ({
            symbol: t.symbol,
            description: t.description,
            exchange: t.exchange,
            date: null,
            actual: null,
            estimate: null,
            surprise: null,
            surprisePercent: null,
          }))
          setTechTickers(mappedTickers)
          
          // Load next 30 days of earnings data
          const earningsRes = await fetch("/api/earnings-next-30-days")
          if (!earningsRes.ok) throw new Error("Failed to fetch earnings data")
          const earningsData = await earningsRes.json()
          
          if (earningsData.earnings && earningsData.earnings.length > 0) {
            setEarnings(earningsData.earnings)
            setViewState("data")
          } else {
            // Fallback to showing all tech tickers if no earnings data
            setEarnings(mappedTickers)
            setViewState("data")
          }
        } else {
          setEarnings([])
          setViewState("empty")
        }
      } catch (err: any) {
        setError(err.message || "Unknown error")
        setEarnings([])
        setViewState("empty")
      }
    })()
  }, [])

  const filteredEarnings = getSortedEarnings()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">LOGO</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Tech Earnings Dashboard</h1>
        </header>

        {/* Filters Section */}
        <div className="mb-8">
          {!isSearchMode && (
            <p className="text-sm text-gray-600 mb-4">
              {activePeriod === "next30" && "Showing tech earnings for the next 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
              {activePeriod === "previous30" && "Showing tech earnings for the previous 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
            </p>
          )}
          {isSearchMode && (
            <p className="text-sm text-gray-600 mb-4">
              {ticker ? (
                <>Showing earnings data for <strong>{ticker}</strong> in {year} {quarter ? `Q${quarter}` : '(all quarters)'}.</>
              ) : (
                <>Showing earnings data for all tech stocks in {year} {quarter ? `Q${quarter}` : '(all quarters)'}.</>
              )}
            </p>
          )}
          <div className="flex flex-col gap-4">
            {/* Time Period Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={loadPrevious30Days}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "previous30"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                }`}
                aria-label="Show previous 30 days earnings"
              >
                Previous 30 Days
              </Button>
              <Button
                onClick={loadNext30Days}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "next30"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                }`}
                aria-label="Show next 30 days earnings"
              >
                Next 30 Days
              </Button>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 max-w-xs">
                <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                  Ticker
                </label>
                <Input
                  id="ticker"
                  type="text"
                  placeholder="e.g. AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2 flex-1 max-w-md">
                <div className="flex-1">
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-2"
                  >
                    Year
                  </label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="h-12 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-gray-900 focus:ring-gray-900"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="quarter"
                    className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-2"
                  >
                    Quarter
                  </label>
                  <select
                    id="quarter"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="h-12 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-gray-900 focus:ring-gray-900"
                  >
                    <option value="">All Quarters</option>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="h-12 px-8 bg-white border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors shadow-sm"
                aria-label="Search earnings data"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              {isSearchMode && (
                <Button
                  onClick={clearSearch}
                  className="h-12 px-8 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                  aria-label="Clear search and show all tech tickers"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white">
          {viewState === "loading" && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className="text-base">Loading...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-4 text-red-600">{error}</div>
          )}
          {viewState === "empty" && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-500">
                <Info className="w-5 h-5" />
                <span className="text-base">No earnings found.</span>
              </div>
            </div>
          )}
          {viewState === "data" && (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("symbol")}
                        >
                          <div className="flex items-center gap-1">
                            Ticker
                            <SortIcon field="symbol" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("exchange")}
                        >
                          <div className="flex items-center gap-1">
                            Exchange
                            <SortIcon field="exchange" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Earnings Date
                            <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("estimate")}
                        >
                          <div className="flex items-center gap-1">
                            Estimate
                            <SortIcon field="estimate" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("actual")}
                        >
                          <div className="flex items-center gap-1">
                            EPS
                            <SortIcon field="actual" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort("surprisePercent")}
                        >
                          <div className="flex items-center gap-1">
                            Surprise
                            <SortIcon field="surprisePercent" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEarnings.map((earning, index) => (
                        <tr key={earning.symbol + (earning.date || "") + index} className={index % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-6 py-4 text-base font-medium text-gray-900">{earning.symbol}</td>
                          <td className="px-6 py-4 text-base text-gray-600">
                            {earning.exchange ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {earning.exchange}
                              </span>
                            ) : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base text-gray-600">
                            {earning.date ? new Date(earning.date).toLocaleDateString() : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base text-gray-600">
                            {earning.estimate !== null && earning.estimate !== undefined ? `$${Number(earning.estimate).toFixed(2)}` : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base text-gray-900">
                            {earning.actual !== null && earning.actual !== undefined ? `$${Number(earning.actual).toFixed(2)}` : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base">
                            {earning.surprisePercent !== null && earning.surprisePercent !== undefined ? (
                              <span className={`font-medium ${Number(earning.surprisePercent) > 0 ? "text-green-600" : Number(earning.surprisePercent) < 0 ? "text-red-600" : ""}`}>
                                {Number(earning.surprisePercent) > 0 ? "+" : ""}{Number(earning.surprisePercent).toFixed(1)}%
                              </span>
                            ) : <span className="text-gray-500">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-4">
                {filteredEarnings.map((earning) => (
                  <Card key={earning.symbol + earning.date} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{earning.symbol}</h3>
                          {earning.exchange && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {earning.exchange}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{earning.date ? new Date(earning.date).toLocaleDateString() : <span className="text-gray-500">-</span>}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-1">Estimate</span>
                          <span className="text-base text-gray-600">{earning.estimate !== null && earning.estimate !== undefined ? `$${Number(earning.estimate).toFixed(2)}` : <span className="text-gray-500">-</span>}</span>
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-1">EPS</span>
                          <span className="text-base text-gray-900">{earning.actual !== null && earning.actual !== undefined ? `$${Number(earning.actual).toFixed(2)}` : <span className="text-gray-500">-</span>}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-1">Surprise</span>
                          <span className={`text-base font-medium ${earning.surprisePercent !== null && earning.surprisePercent !== undefined ? (Number(earning.surprisePercent) > 0 ? "text-green-600" : Number(earning.surprisePercent) < 0 ? "text-red-600" : "") : ""}`}>
                            {earning.surprisePercent !== null && earning.surprisePercent !== undefined ? `${Number(earning.surprisePercent) > 0 ? "+" : ""}${Number(earning.surprisePercent).toFixed(1)}%` : <span className="text-gray-500">-</span>}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
                    </div>
          </div>
        </div>
  )
}
