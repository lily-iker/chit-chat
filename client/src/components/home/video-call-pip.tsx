'use client'

import type React from 'react'

import { useEffect, useRef, useState } from 'react'
import { X, Maximize2 } from 'lucide-react'
import { useVideoCallStore } from '@/store/useVideoCall'
import { useChatStore } from '@/store/useChatStore'
import {
  StreamCall,
  StreamVideo,
  SpeakerLayout,
  useCallStateHooks,
  StreamTheme,
  CallingState,
} from '@stream-io/video-react-sdk'

const PiPVideoContent = () => {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()
  const { endCall } = useVideoCallStore()

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      endCall()
    }
  }, [callingState, endCall])

  return (
    <StreamTheme>
      <div className="w-full h-full">
        <SpeakerLayout />
      </div>
    </StreamTheme>
  )
}

const VideoCallPiP = () => {
  const { client, call, isPiPMode, pipPosition, togglePiPMode, endCall, setPiPPosition } =
    useVideoCallStore()
  const { selectedChat } = useChatStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const pipRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pipRef.current) return

    const rect = pipRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !pipRef.current) return

      const newX = window.innerWidth - (e.clientX - dragOffset.x + pipRef.current.offsetWidth)
      const newY = window.innerHeight - (e.clientY - dragOffset.y + pipRef.current.offsetHeight)

      // Constrain to viewport
      const constrainedX = Math.max(
        10,
        Math.min(newX, window.innerWidth - pipRef.current.offsetWidth - 10)
      )
      const constrainedY = Math.max(
        10,
        Math.min(newY, window.innerHeight - pipRef.current.offsetHeight - 10)
      )

      setPiPPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, setPiPPosition])

  if (!client || !call || !isPiPMode) return null

  return (
    <div
      ref={pipRef}
      className={`fixed z-50 bg-base-100 rounded-lg shadow-2xl border border-base-300 transition-all duration-300 scale-100 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        right: `${pipPosition.x}px`,
        bottom: `${pipPosition.y}px`,
        width: '360px',
        height: '240px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-base-300 bg-base-100 rounded-t-lg transition-opacity duration-200">
        <div className="flex items-center gap-2">
          <div className="avatar">
            <div className="w-6 h-6 rounded-full">
              <img src={selectedChat?.chatImageUrl || '/avatar.png'} alt="Chat Avatar" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium truncate max-w-[120px]">{selectedChat?.name}</h4>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="tooltip tooltip-left" data-tip="Expand">
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePiPMode()
              }}
              className="btn btn-xs btn-ghost"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
          <div className="tooltip tooltip-left" data-tip="End call">
            <button
              onClick={(e) => {
                e.stopPropagation()
                endCall()
              }}
              className="btn btn-xs btn-ghost text-error"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Content */}
      <div
        className="relative overflow-hidden rounded-b-lg"
        style={{ height: 'calc(100% - 40px)' }}
      >
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <PiPVideoContent />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  )
}

export default VideoCallPiP
