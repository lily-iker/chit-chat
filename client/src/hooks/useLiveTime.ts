import { useState, useEffect, useRef } from 'react'
import { formatChatTime } from '@/utils/timeUtils'

/**
 * Custom hook that provides a live updating formatted time string for a given timestamp.
 * The update interval is dynamically adjusted based on the time difference.
 */
export const useLiveTime = (timestamp: string) => {
  const [formattedTime, setFormattedTime] = useState(() => formatChatTime(timestamp))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const updateAndScheduleNext = () => {
      const now = new Date()
      const messageDate = new Date(timestamp)
      const diffInSeconds = (now.getTime() - messageDate.getTime()) / 1000

      const newFormattedTime = formatChatTime(timestamp)
      setFormattedTime(newFormattedTime)

      let nextUpdateInterval: number // in milliseconds

      if (diffInSeconds < 60) {
        // If less than a minute, update every second until it hits 1m
        nextUpdateInterval = 1000 // 1 second
      } else if (diffInSeconds < 60 * 60) {
        // If less than an hour (e.g., "Xm"), update every minute
        nextUpdateInterval = 60 * 1000 // 1 minute
      } else if (diffInSeconds < 24 * 60 * 60) {
        // If less than a day (e.g., "Xh"), update every hour
        nextUpdateInterval = 60 * 60 * 1000 // 1 hour
      } else if (diffInSeconds < 7 * 24 * 60 * 60) {
        // If less than a week (e.g., "Xd"), update every day
        nextUpdateInterval = 24 * 60 * 60 * 1000 // 1 day
      } else {
        // For static dates (month day), no further updates needed
        nextUpdateInterval = 0 // Stop updates
      }

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Set new interval if updates are still needed
      if (nextUpdateInterval > 0) {
        intervalRef.current = setInterval(updateAndScheduleNext, nextUpdateInterval)
      }
    }

    // Initial update and set up the first interval
    updateAndScheduleNext()

    // Cleanup function to clear the interval when the component unmounts
    // or when the timestamp prop changes (re-running the effect)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timestamp]) // Re-run effect if the timestamp changes

  return formattedTime
}
