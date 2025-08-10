import { User, LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthStore } from '@/store/useAuthStore'

const UserProfile = () => {
  const { logout, isLoading } = useAuthStore()

  return (
    <div className="dropdown dropdown-center dropdown-top lg:dropdown-bottom">
      {/* DROPDOWN TRIGGER */}
      <button tabIndex={0} className="btn btn-ghost">
        <User className="size-5" />
        <span className="hidden sm:inline">Profile</span>
      </button>

      {/* DROPDOWN CONTENT */}
      <div
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-44 border border-base-content/10 max-h-80 overflow-y-auto"
      >
        <div className="space-y-1">
          {/* Update Profile */}
          <Link
            to="/profile"
            className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
              hover:bg-base-content/5
            `}
            onClick={() =>
              document.activeElement instanceof HTMLElement && document.activeElement.blur()
            } // closes dropdown
          >
            <User className="size-5" />
            <span className="text-sm font-medium">Update Profile</span>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
              hover:bg-base-content/5
            `}
          >
            <LogOut className="size-5" />
            <span className="text-sm font-medium">{isLoading ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
