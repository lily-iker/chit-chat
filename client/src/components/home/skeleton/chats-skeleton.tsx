const ChatsSkeleton = () => {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-12 h-12 bg-base-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-base-300 rounded w-3/4"></div>
            <div className="h-3 bg-base-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatsSkeleton
