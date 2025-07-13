import { ChevronLeft, X, Video, VideoOff } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useVideoCallStore } from '@/store/useVideoCall'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

const ChatHeader = () => {
  const { selectedChat, setSelectedChat, unsubscribe } = useChatStore()
  const { call, isCallActive, startCall, endCall } = useVideoCallStore()
  const { authUser } = useAuthStore()

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
      // Generate a unique call ID based on chat ID and timestamp
      const callId = `${selectedChat.id}`
      await startCall(callId)
      toast.success('Video call started')
    } catch (error) {
      console.error('Failed to start video call:', error)
      toast.error('Failed to start video call')
    }
  }

  const handleEndCall = () => {
    endCall()
    toast.success('Video call ended')
  }

  if (!selectedChat) return null

  return (
    <div className="p-4 border-b border-base-300">
      <div className="flex items-center justify-between">
        {/* Left section: back button (mobile only), avatar, name */}
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          <button onClick={handleClose} className="lg:hidden btn btn-sm btn-ghost p-0 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedChat.chatImageUrl || '/avatar.png'} alt="Chat Avatar" />
            </div>
          </div>
          {/* Chat name and status */}
          <div className="min-w-0">
            <h3 className="font-medium truncate">{selectedChat.name}</h3>
            {/* <p className="text-sm text-base-content/70">Online</p> */}
          </div>
        </div>

        {/* Right section: Video call button and close button */}
        <div className="flex items-center gap-2">
          {/* Video call button */}
          <div
            className="tooltip tooltip-bottom"
            data-tip={isCallActive ? 'End video call' : 'Start video call'}
          >
            <button
              onClick={isCallActive ? handleEndCall : handleVideoCall}
              className={`btn btn-sm btn-ghost ${isCallActive ? 'text-error' : 'text-primary'}`}
            >
              {isCallActive ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>

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
  )
}

export default ChatHeader
