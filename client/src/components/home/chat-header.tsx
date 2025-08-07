import { ChevronLeft, X, Video, VideoOff, Maximize2 } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useVideoCallStore } from '@/store/useVideoCall'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'
import ChatInfoModal from './chat-info-modal'
import { useState } from 'react'

const ChatHeader = () => {
  const { selectedChat, setSelectedChat, unsubscribe } = useChatStore()
  const { call, isCallActive, currentChatId, isPiPMode, startCall, endCall, togglePiPMode } =
    useVideoCallStore()
  const { authUser } = useAuthStore()
  const [showChatInfo, setShowChatInfo] = useState(false)

  const handleClose = () => {
    unsubscribe()
    setSelectedChat(null)
  }

  const handleVideoCall = async () => {
    if (!selectedChat || !authUser) {
      toast.error('Unable to start video call')
      return
    }

    // If there's already an active call, ask user to end it first
    if (isCallActive && call) {
      toast.error('Please end the current video call before starting a new one')
      return
    }

    try {
      const callId = `${selectedChat.id}`
      await startCall(callId)
    } catch (error) {
      console.error('Failed to start video call:', error)
      toast.error('Failed to start video call')
    }
  }

  const handleEndCall = () => {
    endCall()
  }

  const handleTogglePiP = () => {
    togglePiPMode()
  }

  const handleShowChatInfo = () => {
    setShowChatInfo(true)
  }

  if (!selectedChat) return null

  return (
    <>
      <div className="px-4 py-2 border-b border-base-300">
        <div className="flex items-center justify-between">
          {/* Left section: back button (mobile only), avatar, name */}
          <div className="flex items-center gap-1">
            {/* Mobile back button */}
            <button onClick={handleClose} className="lg:hidden btn btn-circle btn-sm btn-ghost">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Avatar */}
            <div
              className="flex items-center gap-3 hover:cursor-pointer hover:bg-base-200 p-2 rounded-lg transition-colors"
              onClick={handleShowChatInfo}
            >
              <div className="avatar">
                <div className="size-10 rounded-full relative">
                  <img src={selectedChat.chatImageUrl || DEFAULT_PROFILE_IMAGE} alt="Chat Avatar" />
                </div>
              </div>
              {/* Chat name and status */}
              <div className="min-w-0">
                <h3 className="font-medium truncate">{selectedChat.name}</h3>
                {isCallActive && currentChatId === selectedChat.id && (
                  <p className="text-sm text-success">Video Calling</p>
                )}
              </div>
            </div>
          </div>

          {/* Right section: Video call controls and close button */}
          <div className="flex items-center gap-2">
            {/* Video call controls */}
            {isCallActive && currentChatId === selectedChat.id ? (
              <>
                {/* PiP toggle button */}
                <div
                  className="tooltip tooltip-bottom"
                  data-tip={isPiPMode ? 'Expand video call' : 'Picture in Picture'}
                >
                  <button onClick={handleTogglePiP} className="btn btn-sm btn-ghost">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
                {/* End call button */}
                <div className="tooltip tooltip-bottom" data-tip="End video call">
                  <button onClick={handleEndCall} className="btn btn-sm btn-ghost text-error">
                    <VideoOff className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              /* Start call button */
              <div className="tooltip tooltip-bottom" data-tip="Start video call">
                <button onClick={handleVideoCall} className="btn btn-sm btn-ghost text-primary">
                  <Video className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Close button (optional, visible on desktop or for additional actions) */}
            <button
              onClick={() => setSelectedChat(null)}
              className="hidden lg:inline-flex btn btn-sm btn-ghost"
            >
              <X className="w-5 h-5" onClick={handleClose} />
            </button>
          </div>
        </div>
      </div>
      {selectedChat && (
        <ChatInfoModal
          isOpen={showChatInfo}
          onClose={() => setShowChatInfo(false)}
          chat={selectedChat}
        />
      )}
    </>
  )
}

export default ChatHeader
