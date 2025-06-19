import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const LogoutButton = () => {
  const { logout } = useAuthStore()

  return (
    <div className="dropdown dropdown-end">
      <button className="btn btn-ghost" onClick={logout}>
        <LogOut className="size-5" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  )
}

export default LogoutButton
