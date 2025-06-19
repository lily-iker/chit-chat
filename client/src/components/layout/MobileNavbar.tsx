import { MessageSquareText, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

const MobileNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header>
      <div className="flex-shrink-0 p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquareText className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chit Chat</h1>
            </Link>
          </div>
          <button
            className="btn btn-circle btn-ghost"
            onClick={() => {
              // TODO: Open create chat modal
              console.log('Create new chat')
            }}
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
      </div>
    </header>
  )
}

export default MobileNavbar
