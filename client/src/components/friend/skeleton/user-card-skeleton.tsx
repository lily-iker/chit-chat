const UserCardSkeleton = () => {
  return (
    <>
      {Array.from({ length: 12 }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-xl border border-base-300 p-4 space-y-3 bg-base-100"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-base-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-base-300 rounded" />
              <div className="h-3 w-1/2 bg-base-300 rounded" />
            </div>
          </div>
          {/* <div className="h-8 w-full bg-base-300 rounded" /> */}
        </div>
      ))}
    </>
  )
}

export default UserCardSkeleton
