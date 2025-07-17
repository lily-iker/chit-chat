import ChatContainer from '@/components/home/chat-container'
import NoChatSelected from '@/components/home/no-chat-selected'
import Sidebar from '@/components/home/side-bar'
import ChatList from '@/components/home/chat-list'
import { useChatStore } from '@/store/useChatStore'
import useIsMobile from '@/hooks/useIsMobile'
import { useEffect } from 'react'
import VideoCallModal from '@/components/home/video-call-modal'
import VideoCallPiP from '@/components/home/video-call-pip'

const HomePage = () => {
  const { selectedChat, getChats } = useChatStore()
  const isMobile = useIsMobile()

  useEffect(() => {
    getChats()
  }, [getChats])

  return (
    <div className="h-full bg-base-200">
      <div className="flex items-center justify-center lg:pt-8">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-7xl h-[calc(100vh-4rem)] lg:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Sidebar: always on lg+, mobile fallback handled below */}
            {!isMobile && (
              <div className="flex w-72 border-r border-base-300">
                <Sidebar />
              </div>
            )}

            {/* Desktop fallback when no chat is selected */}
            {!isMobile && !selectedChat && (
              <div className="hidden lg:flex flex-1 items-center justify-center">
                <NoChatSelected />
              </div>
            )}

            {/* Mobile-only: chat list if no chat is selected */}
            {isMobile && !selectedChat && (
              <div className="flex w-full lg:hidden">
                <ChatList />
              </div>
            )}

            {/* Chat content */}
            {selectedChat && (
              <div className="flex flex-col w-full flex-1">
                <ChatContainer />
              </div>
            )}

            <VideoCallModal />
            <VideoCallPiP />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
