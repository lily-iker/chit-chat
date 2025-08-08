import { Home } from 'lucide-react'
import FriendButton from '../user/friend-button'
import ThemeSelector from '../theme/theme-selector'
import UserProfile from '../user/user-profile'
import { useNavigate } from 'react-router'

const MobileNavbar = () => {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        {/* Chats Tab */}
        <div onClick={() => navigate('/')} className="flex flex-col items-center gap-1 p-2">
          <button className="btn btn-ghost">
            <Home className="size-5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        {/* Theme Tab */}
        <div className="flex flex-col items-center gap-1 p-2">
          <ThemeSelector />
        </div>

        {/* Profile Tab */}
        <div className="flex flex-col items-center gap-1 p-2">
          <UserProfile />
        </div>

        {/* Friends Tab */}
        <div className="flex flex-col items-center gap-1 p-2">
          <FriendButton />
        </div>
      </div>
    </div>
  )
}

export default MobileNavbar
