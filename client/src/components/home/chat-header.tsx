import { ChevronLeft, X } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'

const ChatHeader = () => {
  const { selectedChat, setSelectedChat, unsubscribe } = useChatStore()

  const handleClose = () => {
    unsubscribe()
    setSelectedChat(null)
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

        {/* Close button (optional, visible on desktop or for additional actions) */}
        <button
          onClick={() => setSelectedChat(null)}
          className="hidden lg:inline-flex btn btn-sm btn-ghost"
        >
          <X className="w-5 h-5" onClick={handleClose} />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader
