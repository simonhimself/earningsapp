"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Building2, Info, ChevronUp, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"


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

// Helper function to format dates nicely with relative time context
function formatEarningsDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const earningsDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Calculate days difference
  const diffTime = earningsDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Format the date
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }
  const formattedDate = date.toLocaleDateString("en-US", options)

  // Add relative time context
  let relativeText = ""

  if (diffDays === 0) {
    relativeText = "Today"
  } else if (diffDays === 1) {
    relativeText = "Tomorrow"
  } else if (diffDays === -1) {
    relativeText = "Yesterday"
  } else if (diffDays > 0 && diffDays <= 7) {
    relativeText = `In ${diffDays} days`
  } else if (diffDays < 0 && diffDays >= -7) {
    relativeText = `${Math.abs(diffDays)} days ago`
  } else if (diffDays > 7) {
    relativeText = `In ${diffDays} days`
  } else {
    relativeText = `${Math.abs(diffDays)} days ago`
  }

  return { formattedDate, relativeText, diffDays }
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
  const [quarter, setQuarter] = useState("all")
  const [earnings, setEarnings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [techTickers, setTechTickers] = useState<any[]>([])

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)
  const [activePeriod, setActivePeriod] = useState<"next30" | "previous30" | "today" | "tomorrow" | "search">("today")

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
          if (quarter && quarter !== "all") params.append("quarter", quarter)

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
              if (quarter && quarter !== "all") params.append("quarter", quarter)
              
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
    setActivePeriod("today")
    loadToday()
  }

  const loadNext30Days = async () => {
    setViewState("loading")
    setError(null)
    setActivePeriod("next30")
    setIsSearchMode(false)
    // Set default sorting to date ascending (nearest dates first)
    setSortField("date")
    setSortDirection("asc")
    
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
    // Set default sorting to date descending (most recent dates first)
    setSortField("date")
    setSortDirection("desc")
    
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

  const loadToday = async () => {
    setViewState("loading")
    setError(null)
    setActivePeriod("today")
    setIsSearchMode(false)
    // Set default sorting to symbol for today's earnings
    setSortField("symbol")
    setSortDirection("asc")
    
    try {
      const res = await fetch("/api/earnings-today")
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

  const loadTomorrow = async () => {
    setViewState("loading")
    setError(null)
    setActivePeriod("tomorrow")
    setIsSearchMode(false)
    // Set default sorting to symbol for tomorrow's earnings
    setSortField("symbol")
    setSortDirection("asc")
    
    try {
      const res = await fetch("/api/earnings-tomorrow")
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
    // On mount, load today's tech earnings by default
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
          
          // Load today's earnings data
          const earningsRes = await fetch("/api/earnings-today")
          if (!earningsRes.ok) throw new Error("Failed to fetch earnings data")
          const earningsData = await earningsRes.json()
          
          // Set default sorting to symbol ascending for today's earnings
          setSortField("symbol")
          setSortDirection("asc")
          
          if (earningsData.earnings && earningsData.earnings.length > 0) {
            setEarnings(earningsData.earnings)
            setViewState("data")
          } else {
            // If no earnings today, show empty state instead of fallback
            setEarnings([])
            setViewState("empty")
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
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors">
                <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">LOGO</span>
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight transition-colors">Tech Earnings Dashboard</h1>
        </header>

        {/* Filters Section */}
        <div className="mb-8">
          {!isSearchMode && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors">
              {activePeriod === "next30" && "Showing tech earnings for the next 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
              {activePeriod === "previous30" && "Showing tech earnings for the previous 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
              {activePeriod === "today" && "Showing tech earnings for today. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
              {activePeriod === "tomorrow" && "Showing tech earnings for tomorrow. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
            </p>
          )}
          {isSearchMode && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors">
              {ticker ? (
                <>Showing earnings data for <strong className="text-gray-900 dark:text-gray-100">{ticker}</strong> in {year} {quarter ? `Q${quarter}` : '(all quarters)'}.</>
              ) : (
                <>Showing earnings data for all tech stocks in {year} {quarter ? `Q${quarter}` : '(all quarters)'}.</>
              )}
            </p>
          )}
          <div className="flex flex-col gap-4">
            {/* Time Period Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={loadPrevious30Days}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "previous30"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900"
                }`}
                aria-label="Show previous 30 days earnings"
              >
                Previous 30 Days
              </Button>
              <Button
                onClick={loadToday}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "today"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900"
                }`}
                aria-label="Show today's earnings"
              >
                Today
              </Button>
              <Button
                onClick={loadTomorrow}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "tomorrow"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900"
                }`}
                aria-label="Show tomorrow's earnings"
              >
                Tomorrow
              </Button>
              <Button
                onClick={loadNext30Days}
                className={`h-12 px-8 transition-colors shadow-sm ${
                  activePeriod === "next30"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900"
                }`}
                aria-label="Show next 30 days earnings"
              >
                Next 30 Days
              </Button>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 max-w-xs">
                <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 transition-colors">
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
                />
              </div>

              <div className="flex gap-2 flex-1 max-w-md">
                <div className="flex-1">
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 transition-colors"
                  >
                    Year
                  </label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="quarter"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 transition-colors"
                  >
                    Quarter
                  </label>
                  <Select value={quarter} onValueChange={setQuarter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Quarters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quarters</SelectItem>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="h-12 px-8 bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors shadow-sm"
                aria-label="Search earnings data"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              {isSearchMode && (
                <Button
                  onClick={clearSearch}
                  className="h-12 px-8 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                  aria-label="Clear search and show all tech tickers"
                >
                  Clear Search
                </Button>
              )}
            </div>
            

          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white dark:bg-gray-900 transition-colors">
          {viewState === "loading" && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin"></div>
                <span className="text-base">Loading...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-4 text-red-600 dark:text-red-400">{error}</div>
          )}
          {viewState === "empty" && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Info className="w-5 h-5" />
                <span className="text-base">No earnings found.</span>
              </div>
            </div>
          )}
          {viewState === "data" && (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("symbol")}
                        >
                          <div className="flex items-center gap-1">
                            Ticker
                            <SortIcon field="symbol" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("exchange")}
                        >
                          <div className="flex items-center gap-1">
                            Exchange
                            <SortIcon field="exchange" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Earnings Date
                            <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("estimate")}
                        >
                          <div className="flex items-center gap-1">
                            Estimate
                            <SortIcon field="estimate" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("actual")}
                        >
                          <div className="flex items-center gap-1">
                            EPS
                            <SortIcon field="actual" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none transition-colors"
                          onClick={() => handleSort("surprisePercent")}
                        >
                          <div className="flex items-center gap-1">
                            Surprise
                            <SortIcon field="surprisePercent" currentField={sortField} direction={sortDirection} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredEarnings.map((earning, index) => (
                        <tr key={earning.symbol + (earning.date || "") + index} className={index % 2 === 1 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}>
                          <td className="px-6 py-4 text-base font-medium text-gray-900 dark:text-gray-100">{earning.symbol}</td>
                          <td className="px-6 py-4 text-base text-gray-600 dark:text-gray-400">
                            {earning.exchange ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {earning.exchange}
                              </span>
                            ) : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            {earning.date ? (
                              <div className="flex flex-col">
                                <span className="text-base text-gray-900 dark:text-gray-100 font-medium">
                                  {formatEarningsDate(earning.date).formattedDate}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatEarningsDate(earning.date).relativeText}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-base text-gray-600 dark:text-gray-400">
                            {earning.estimate !== null && earning.estimate !== undefined ? `$${Number(earning.estimate).toFixed(2)}` : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base text-gray-900 dark:text-gray-100">
                            {earning.actual !== null && earning.actual !== undefined ? `$${Number(earning.actual).toFixed(2)}` : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-base">
                            {earning.surprisePercent !== null && earning.surprisePercent !== undefined ? (
                              <span className={`font-medium ${Number(earning.surprisePercent) > 0 ? "text-green-600" : Number(earning.surprisePercent) < 0 ? "text-red-600" : ""}`}>
                                {Number(earning.surprisePercent) > 0 ? "+" : ""}{Number(earning.surprisePercent).toFixed(1)}%
                              </span>
                            ) : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-6">
                {filteredEarnings.map((earning) => (
                  <Card key={earning.symbol + earning.date} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Header Section */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{earning.symbol}</h3>
                          {earning.exchange && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {earning.exchange}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {earning.date ? formatEarningsDate(earning.date).formattedDate : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {earning.date ? formatEarningsDate(earning.date).relativeText : ""}
                          </div>
                        </div>
                      </div>
                      
                      {/* Data Grid - Consistent with desktop order: Estimate → EPS → Surprise */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Estimate</span>
                          <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                            {earning.estimate !== null && earning.estimate !== undefined ? `$${Number(earning.estimate).toFixed(2)}` : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">EPS</span>
                          <span className="text-lg text-gray-900 dark:text-gray-100 font-semibold">
                            {earning.actual !== null && earning.actual !== undefined ? `$${Number(earning.actual).toFixed(2)}` : <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </span>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Surprise</span>
                          <span className={`text-lg font-bold ${earning.surprisePercent !== null && earning.surprisePercent !== undefined ? (Number(earning.surprisePercent) > 0 ? "text-green-600 dark:text-green-400" : Number(earning.surprisePercent) < 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400") : "text-gray-500 dark:text-gray-400"}`}>
                            {earning.surprisePercent !== null && earning.surprisePercent !== undefined ? `${Number(earning.surprisePercent) > 0 ? "+" : ""}${Number(earning.surprisePercent).toFixed(1)}%` : <span className="text-gray-500 dark:text-gray-400">-</span>}
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
