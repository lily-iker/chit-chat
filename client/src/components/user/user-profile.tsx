import { User } from 'lucide-react'

const UserProfile = () => {
  return (
    <div className="dropdown dropdown-end">
      {/* DROPDOWN TRIGGER */}
      <button tabIndex={0} className="btn btn-ghost">
        <User className="size-5" />
        <span className="hidden sm:inline">Profile</span>
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-56 border border-base-content/10 max-h-80 overflow-y-auto"
      >
        <div className="space-y-1">
          <button
            className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'}
              `}
          >
            <span className="text-sm font-medium"></span>

            <div className="ml-auto flex gap-1">
              <span className="size-3 rounded-sm bg-primary" />
              <span className="size-3 rounded-sm bg-secondary" />
              <span className="size-3 rounded-sm bg-accent" />
              <span className="size-3 rounded-sm bg-neutral" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
