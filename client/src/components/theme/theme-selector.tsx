import { Paintbrush } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { THEMES } from '@/constant'

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="dropdown dropdown-center dropdown-top lg:dropdown-bottom">
      {/* DROPDOWN TRIGGER */}
      <button tabIndex={0} className="btn btn-ghost">
        <Paintbrush className="size-5" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-56 border border-base-content/10 max-h-80 overflow-y-auto"
      >
        <div className="space-y-1">
          {THEMES.map((THEME) => (
            <button
              key={THEME}
              className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                ${theme === THEME ? 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'}
              `}
              onClick={() => setTheme(THEME)}
            >
              <span className="text-sm font-medium">
                {' '}
                {THEME.charAt(0).toUpperCase() + THEME.slice(1)}
              </span>

              <div className="ml-auto flex gap-1">
                <span data-theme={THEME} className="size-3 rounded-sm bg-primary" />
                <span data-theme={THEME} className="size-3 rounded-sm bg-secondary" />
                <span data-theme={THEME} className="size-3 rounded-sm bg-accent" />
                <span data-theme={THEME} className="size-3 rounded-sm bg-neutral" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
export default ThemeSelector
