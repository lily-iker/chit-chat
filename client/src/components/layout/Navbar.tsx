import { Link } from 'react-router'
import { MessageSquareText } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import ThemeSelector from '../theme/theme-selector'
import UserProfile from '../user/user-profile'
import FriendButton from '../user/friend-button'

const Navbar = () => {
  const { authUser } = useAuthStore()

  return (
    <header
      className="bg-base-100/80 border-b border-base-300 sticky w-full top-0 z-40 
    backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-center md:justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquareText className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chit Chat</h1>
            </Link>
          </div>

          {/* <div className="hidden md:flex items-center gap-2"> */}
          <div className="flex items-center gap-2">
            <ThemeSelector />

            {authUser && (
              <>
                <UserProfile />
                <FriendButton />
                {/* Todo: add notification button */}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
