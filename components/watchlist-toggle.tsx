"use client"

import * as React from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WatchlistToggleProps {
  count: number
  isActive: boolean
  onClick: () => void
}

export function WatchlistToggle({ count, isActive, onClick }: WatchlistToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`h-10 w-10 relative transition-colors ${
        isActive 
          ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      aria-label={isActive ? "Hide watchlist view" : "Show watchlist"}
    >
      {isActive ? (
        <BookmarkCheck className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Bookmark className="h-[1.2rem] w-[1.2rem]" />
      )}
      
      {/* Count badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
      
      <span className="sr-only">
        {isActive ? "Hide watchlist" : "Show watchlist"} ({count} items)
      </span>
    </Button>
  )
}
