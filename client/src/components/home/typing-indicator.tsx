import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from '@/store/useAuthStore'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

const TypingIndicator = () => {
  const { typingUserIds, selectedChat } = useChatStore()
  const { authUser } = useAuthStore()

  // Filter out the current user if they're typing (you don't want to show your own typing indicator)
  const otherTypingUserIds = typingUserIds.filter((id) => id !== authUser?.id)

  if (otherTypingUserIds.length === 0) return null

  // Get the first 3 typing users' profile info from the current chat participants
  const typingUsers =
    selectedChat?.participantsInfo
      ?.filter((participant) => otherTypingUserIds.includes(participant.id))
      .slice(0, 3) || []

  if (typingUsers.length === 0) return null

  return (
    <div className="flex items-end gap-2 justify-start">
      {/* Overlapping profile images */}
      <div className="flex-shrink-0 w-8 h-8 relative">
        {typingUsers.map((typingUser, index) => (
          <div
            key={index}
            className="absolute top-0 w-8 h-8 rounded-full overflow-hidden"
            style={{
              left: `${index * 12}px`,
              zIndex: index,
            }}
          >
            <img
              src={typingUser.profileImageUrl || DEFAULT_PROFILE_IMAGE}
              alt="Typing user"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Typing bubble */}
      <div className="bg-secondary text-secondary-content rounded-xl rounded-bl-sm px-3 py-3.5">
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 rounded-full bg-secondary-content opacity-60 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-secondary-content opacity-60 animate-bounce"
            style={{ animationDelay: '100ms' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-secondary-content opacity-60 animate-bounce"
            style={{ animationDelay: '200ms' }}
          />
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
