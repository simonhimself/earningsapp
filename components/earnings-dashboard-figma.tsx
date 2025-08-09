"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Eye, Bell, TrendingUp, MoreHorizontal, Bookmark, Building2, ChevronUp, ChevronDown } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";
import { WatchlistToggle } from "./watchlist-toggle";
import { useWatchlist } from "@/hooks/use-watchlist";

// Type definitions based on our existing data structure
interface EarningsData {
  symbol: string;
  exchange?: string;
  date?: string;
  estimate?: number | null;
  actual?: number | null;
  surprisePercent?: number | null;
}

type ViewState = "loading" | "data" | "error" | "empty"
type SortField = "symbol" | "exchange" | "date" | "estimate" | "actual" | "surprisePercent"
type SortDirection = "asc" | "desc" | null

// Sort icon component to show current sort state
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

export default function EarningsDashboardFigma() {
  // UI state for hover interactions
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [iconPosition, setIconPosition] = useState<number>(0);
  const rowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tableHeaderRef = useRef<HTMLDivElement | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Existing earnings app state
  const [viewState, setViewState] = useState<ViewState>("data")
  const [ticker, setTicker] = useState("")
  const [year, setYear] = useState("2025")
  const [quarter, setQuarter] = useState("all")
  const [earnings, setEarnings] = useState<EarningsData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)
  const [activePeriod, setActivePeriod] = useState<"next30" | "previous30" | "today" | "tomorrow" | "search" | "watchlist">("today")
  
  // Watchlist functionality
  const watchlist = useWatchlist()
  const [isWatchlistMode, setIsWatchlistMode] = useState(false)

  // Action icons for the floating panel
  const actionIcons = [
    { 
      icon: Bookmark, 
      label: 'Add to Watchlist', 
      color: 'text-blue-500 hover:text-blue-700',
      onClick: (symbol: string) => watchlist.toggleWatchlist(symbol)
    },
    { 
      icon: Eye, 
      label: 'View Details', 
      color: 'text-green-500 hover:text-green-700',
      onClick: (symbol: string) => console.log('View details for', symbol)
    },
    { 
      icon: Bell, 
      label: 'Set Alert', 
      color: 'text-yellow-500 hover:text-yellow-700',
      onClick: (symbol: string) => console.log('Set alert for', symbol)
    },
    { 
      icon: TrendingUp, 
      label: 'View Chart', 
      color: 'text-purple-500 hover:text-purple-700',
      onClick: (symbol: string) => console.log('View chart for', symbol)
    }
  ];

  // Hover interaction handlers
  const handleRowHover = (symbol: string) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setHoveredRow(symbol);
    
    const rowElement = rowRefs.current[symbol];
    const headerElement = tableHeaderRef.current;
    
    if (rowElement && headerElement) {
      const headerRect = headerElement.getBoundingClientRect();
      const rowRect = rowElement.getBoundingClientRect();
      const offset = rowRect.top - headerRect.top + (rowRect.height / 2);
      setIconPosition(offset);
    }
  };

  const handleHoverEnd = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredRow(null);
    }, 50);
  };

  const handleIconAreaHover = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleIconAreaLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredRow(null);
    }, 50);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Date formatting function
  const formatEarningsDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    }
    const formattedDate = date.toLocaleDateString('en-US', options)
    
    let relativeText = ""
    if (isToday) {
      relativeText = "Today"
    } else if (isTomorrow) {
      relativeText = "Tomorrow"
    } else {
      const diffTime = date.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0) {
        relativeText = `In ${diffDays} day${diffDays > 1 ? 's' : ''}`
      } else {
        const absDays = Math.abs(diffDays)
        relativeText = `${absDays} day${absDays > 1 ? 's' : ''} ago`
      }
    }
    
    return { formattedDate, relativeText }
  }

  // API loading functions (placeholder - will integrate real ones next)
  const loadToday = async () => {
    setViewState("loading")
    setActivePeriod("today")
    setIsSearchMode(false)
    setIsWatchlistMode(false)
    // Set default sorting to symbol for today's earnings
    setSortField("symbol")
    setSortDirection("asc")
    
    try {
      const response = await fetch('/api/earnings-today')
      if (!response.ok) throw new Error("Failed to fetch earnings data")
      const data = await response.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load today's earnings")
      setViewState("error")
    }
  }

  const loadNext30Days = async () => {
    setViewState("loading")
    setActivePeriod("next30")
    setIsSearchMode(false)
    setIsWatchlistMode(false)
    // Set default sorting to date ascending (earliest dates first)
    setSortField("date")
    setSortDirection("asc")
    
    try {
      const response = await fetch('/api/earnings-next-30-days')
      if (!response.ok) throw new Error("Failed to fetch earnings data")
      const data = await response.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load next 30 days earnings")
      setViewState("error")
    }
  }

  const loadPrevious30Days = async () => {
    setViewState("loading")
    setActivePeriod("previous30")
    setIsSearchMode(false)
    setIsWatchlistMode(false)
    // Set default sorting to date descending (most recent dates first)
    setSortField("date")
    setSortDirection("desc")
    
    try {
      const response = await fetch('/api/earnings-previous-30-days')
      if (!response.ok) throw new Error("Failed to fetch earnings data")
      const data = await response.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load previous 30 days earnings")
      setViewState("error")
    }
  }

  const loadTomorrow = async () => {
    setViewState("loading")
    setActivePeriod("tomorrow")
    setIsSearchMode(false)
    setIsWatchlistMode(false)
    
    try {
      const response = await fetch('/api/earnings-tomorrow')
      if (!response.ok) throw new Error("Failed to fetch earnings data")
      const data = await response.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tomorrow's earnings")
      setViewState("error")
    }
  }

  const handleSearch = async () => {
    setViewState("loading")
    setActivePeriod("search")
    setIsSearchMode(true)
    setIsWatchlistMode(false)
    
    try {
      let url = `/api/earnings?year=${year}`
      if (quarter && quarter !== "all") {
        url += `&quarter=${quarter}`
      }
      if (ticker.trim()) {
        url += `&symbol=${ticker.trim().toUpperCase()}`
      }
      
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch earnings data")
      const data = await response.json()
      
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings)
        setViewState("data")
      } else {
        setEarnings([])
        setViewState("empty")
      }
    } catch (err: any) {
      setError(err.message || "Failed to search earnings")
      setViewState("error")
    }
  }

  const toggleWatchlistMode = () => {
    const newWatchlistMode = !isWatchlistMode
    setIsWatchlistMode(newWatchlistMode)
    
    if (newWatchlistMode) {
      setActivePeriod("watchlist")
      setIsSearchMode(false)
      setTicker("")
    } else {
      setActivePeriod("today")
      loadToday()
    }
  }

  // Handle column sorting
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

  // Filter and sort earnings based on watchlist mode and sort settings
  const getFilteredEarnings = () => {
    let filtered = earnings
    
    if (isWatchlistMode) {
      const watchedSymbols = watchlist.getWatchedSymbols()
      filtered = filtered.filter(earning => watchedSymbols.includes(earning.symbol))
    }
    
    // Apply sorting if set
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = a[sortField]
        let bValue: string | number = b[sortField]
        
        // Handle numeric fields
        if (sortField === "actual" || sortField === "estimate" || sortField === "surprisePercent") {
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
        } else if (sortField === "date") {
          // Handle date sorting
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

  // Load initial data
  useEffect(() => {
    loadToday()
  }, [])

  const filteredEarnings = getFilteredEarnings()
  const shouldShowIcons = hoveredRow !== null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">LOGO</span>
          </div>
          <div className="flex items-center gap-2">
            <WatchlistToggle 
              count={watchlist.count}
              isActive={isWatchlistMode}
              onClick={toggleWatchlistMode}
            />
            <ThemeToggle />
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="mb-4 text-gray-900 dark:text-gray-100 transition-colors">TickrTime, never miss earnings again</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
            {!isSearchMode && !isWatchlistMode && (
              <>
                {activePeriod === "next30" && "Showing tech earnings for the next 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
                {activePeriod === "previous30" && "Showing tech earnings for the previous 30 days. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
                {activePeriod === "today" && "Showing tech earnings for today. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
                {activePeriod === "tomorrow" && "Showing tech earnings for tomorrow. Use the buttons above for quick navigation, or use the search filters below for specific queries."}
              </>
            )}
            {isWatchlistMode && `Showing earnings for your ${watchlist.count} watched tickers. ${watchlist.count === 0 ? "Add tickers to your watchlist using the floating actions." : "Click the watchlist icon again to return to the main view."}`}
            {isSearchMode && (
              <>
                {ticker ? (
                  <>Showing earnings data for <strong>{ticker}</strong> in {year} {quarter && quarter !== "all" ? `Q${quarter}` : '(all quarters)'}.</>
                ) : (
                  <>Showing earnings data for all tech stocks in {year} {quarter && quarter !== "all" ? `Q${quarter}` : '(all quarters)'}.</>
                )}
              </>
            )}
          </p>

          {/* Navigation Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button 
              variant={activePeriod === "previous30" ? "default" : "outline"}
              className={activePeriod === "previous30" ? "bg-gray-900 text-white" : ""}
              onClick={loadPrevious30Days}
            >
              Previous 30 Days
            </Button>
            <Button 
              variant={activePeriod === "today" ? "default" : "outline"}
              className={activePeriod === "today" ? "bg-gray-900 text-white" : ""}
              onClick={loadToday}
            >
              Today
            </Button>
            <Button 
              variant={activePeriod === "tomorrow" ? "default" : "outline"}
              className={activePeriod === "tomorrow" ? "bg-gray-900 text-white" : ""}
              onClick={loadTomorrow}
            >
              Tomorrow
            </Button>
            <Button 
              variant={activePeriod === "next30" ? "default" : "outline"}
              className={activePeriod === "next30" ? "bg-gray-900 text-white" : ""}
              onClick={loadNext30Days}
            >
              Next 30 Days
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">TICKER</label>
            <Input 
              placeholder="e.g. AAPL" 
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">YEAR</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">QUARTER</label>
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
          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">&nbsp;</label>
            <Button 
              className="w-full" 
              variant={activePeriod === "search" ? "default" : "outline"}
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Loading/Error/Empty States */}
        {viewState === "loading" && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-base">Loading...</span>
            </div>
          </div>
        )}

        {viewState === "error" && (
          <div className="flex items-center justify-center py-4 text-red-600">{error}</div>
        )}

        {viewState === "empty" && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <span className="text-base">No earnings found.</span>
            </div>
          </div>
        )}

        {/* Table Container with Action Icons */}
        {viewState === "data" && (
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
              {/* Table Header */}
              <div 
                ref={tableHeaderRef}
                className="grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors rounded-t-lg"
              >
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("symbol")}
                >
                  TICKER
                  <SortIcon field="symbol" currentField={sortField} direction={sortDirection} />
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("exchange")}
                >
                  EXCHANGE
                  <SortIcon field="exchange" currentField={sortField} direction={sortDirection} />
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("date")}
                >
                  EARNINGS DATE
                  <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("estimate")}
                >
                  ESTIMATE
                  <SortIcon field="estimate" currentField={sortField} direction={sortDirection} />
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("actual")}
                >
                  EPS
                  <SortIcon field="actual" currentField={sortField} direction={sortDirection} />
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800"
                  onClick={() => handleSort("surprisePercent")}
                >
                  SURPRISE
                  <SortIcon field="surprisePercent" currentField={sortField} direction={sortDirection} />
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {filteredEarnings.map((earning) => (
                  <div
                    key={earning.symbol + earning.date}
                    ref={(el) => rowRefs.current[earning.symbol] = el}
                    className={`grid grid-cols-6 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer relative ${
                      hoveredRow === earning.symbol
                        ? 'bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onMouseEnter={() => handleRowHover(earning.symbol)}
                    onMouseLeave={handleHoverEnd}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{earning.symbol}</span>
                    </div>
                    <div className="flex items-center">
                      {earning.exchange ? (
                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs transition-colors">
                          {earning.exchange}
                        </Badge>
                      ) : <span className="text-gray-500 dark:text-gray-400">-</span>}
                    </div>
                    <div className="flex flex-col">
                      {earning.date ? (
                        <>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{formatEarningsDate(earning.date).formattedDate}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatEarningsDate(earning.date).relativeText}</span>
                        </>
                      ) : <span className="text-gray-500 dark:text-gray-400">-</span>}
                    </div>
                    <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                      {earning.estimate !== null && earning.estimate !== undefined ? `$${Number(earning.estimate).toFixed(2)}` : "-"}
                    </div>
                    <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                      {earning.actual !== null && earning.actual !== undefined ? `$${Number(earning.actual).toFixed(2)}` : "-"}
                    </div>
                    <div className={`flex items-center text-sm ${
                      earning.surprisePercent !== null && earning.surprisePercent !== undefined 
                        ? (Number(earning.surprisePercent) > 0 ? "text-green-600 dark:text-green-400" : Number(earning.surprisePercent) < 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400")
                        : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {earning.surprisePercent !== null && earning.surprisePercent !== undefined ? (
                        `${Number(earning.surprisePercent) > 0 ? "+" : ""}${Number(earning.surprisePercent).toFixed(1)}%`
                      ) : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hover Bridge Area */}
            {shouldShowIcons && (
              <div 
                className="absolute pointer-events-auto"
                style={{ 
                  left: '100%',
                  top: `${iconPosition - 30}px`,
                  width: '80px',
                  height: '60px',
                  zIndex: 1,
                }}
                onMouseEnter={handleIconAreaHover}
                onMouseLeave={handleIconAreaLeave}
              />
            )}

            {/* Action Icons Panel */}
            <div 
              className={`absolute flex items-center transition-all duration-300 ease-out z-10 ${
                shouldShowIcons 
                  ? 'opacity-100 translate-x-0 pointer-events-auto' 
                  : 'opacity-0 translate-x-4 pointer-events-none'
              }`}
              style={{ 
                left: '100%',
                marginLeft: '1rem',
                top: `${iconPosition}px`,
                transform: `translateY(-50%)`,
              }}
              onMouseEnter={handleIconAreaHover}
              onMouseLeave={handleIconAreaLeave}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-2 flex flex-col gap-2 transition-colors">
                {actionIcons.map((action, index) => {
                  const Icon = action.icon;
                  const isBookmark = action.icon === Bookmark;
                  const isInWatchlist = isBookmark && hoveredRow && watchlist.isInWatchlist(hoveredRow);
                  
                  return (
                    <button
                      key={index}
                                          className={`p-2 rounded-md transition-colors duration-200 ${action.color} hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isBookmark && isInWatchlist ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      title={isBookmark && hoveredRow ? (
                        isInWatchlist ? `Remove ${hoveredRow} from watchlist` : `Add ${hoveredRow} to watchlist`
                      ) : action.label}
                      onClick={() => hoveredRow && action.onClick(hoveredRow)}
                    >
                      <Icon className={`w-4 h-4 ${isBookmark && isInWatchlist ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
          <p>Hover over any row to see available actions. The icons stay visible when you hover over them.</p>
        </div>
      </div>
    </div>
  );
}
