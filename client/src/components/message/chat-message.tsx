import { formatMessageTime, formatDateDivider } from '@/utils/timeUtils'
import { MessageType } from '@/types/enum/MessageType'
import type { Message } from '@/types/Message'
import type { ParticipantInfo } from '@/types/Chat'
import MessageActions from './message-actions'
import MessageEditForm from './message-edit-form'
import { useState } from 'react'
import DateDivider from '../home/date-divider'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

interface ChatMessageProps {
  message: Message
  isMyMessage: boolean
  senderInfo?: ParticipantInfo
  showProfileImage: boolean
  isConsecutive: boolean
  isGroupChat: boolean
  seenByUsers: string[]
  participantsInfo?: ParticipantInfo[]
  shouldShowDateDivider?: boolean
}

export default function ChatMessage({
  message,
  isMyMessage,
  senderInfo,
  showProfileImage,
  isConsecutive,
  isGroupChat,
  seenByUsers,
  participantsInfo,
  shouldShowDateDivider = false,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)

  // SYSTEM message
  if (message.messageType === MessageType.SYSTEM) {
    return (
      <div className="w-full text-center py-2">
        {shouldShowDateDivider && <DateDivider date={formatDateDivider(message.createdAt)} />}
        <div className="w-full text-center py-2">
          <span className="text-xs text-base-content/60 italic">{message.content}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {shouldShowDateDivider && <DateDivider date={formatDateDivider(message.createdAt)} />}
      {message.isEdited && !message.isDeleted && (
        <div
          className={`text-xs italic text-base-content/50 mb-1 px-1 ${
            isMyMessage ? 'text-right pr-12' : 'text-left pl-12'
          }`}
        >
          (edited)
        </div>
      )}
      {/* Message container */}
      <div
        className={`flex items-end gap-2 group relative ${
          isMyMessage ? 'justify-end' : 'justify-start'
        } ${isConsecutive ? 'mt-1' : 'mt-4'}`}
      >
        {/* Left side - Other user's profile image */}
        {!isMyMessage && (
          <div className="flex-shrink-0 w-8 h-8">
            {showProfileImage ? (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={senderInfo?.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8"></div>
            )}
          </div>
        )}
        {/* Message content and actions container */}
        <div
          className={`flex flex-col max-w-[50%] lg:max-w-[60%] ${
            isMyMessage ? 'items-end' : 'items-start'
          }`}
        >
          {/* Sender name for group chats */}
          {!isConsecutive && !isMyMessage && isGroupChat && (
            <div className="text-xs font-semibold text-base-content/70 mb-1 px-1">
              {senderInfo?.fullName || 'Unknown'}
            </div>
          )}
          {/* Message bubble and actions container */}
          <div className="relative flex items-center">
            {/* MessageActions for my message (left of bubble) */}
            {!message.isDeleted && isMyMessage && (
              <div className="absolute -left-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="pointer-events-auto">
                  <MessageActions message={message} onEdit={() => setIsEditing(true)} />
                </div>
              </div>
            )}

            {/* Message bubble or edit form */}
            {isEditing ? (
              <MessageEditForm
                message={message}
                onCancel={() => setIsEditing(false)}
                onSave={() => setIsEditing(false)}
              />
            ) : message.isDeleted ? (
              <div
                className={`px-3 py-2 italic text-base-content/60 ${
                  isMyMessage
                    ? `bg-base-200 ${
                        showProfileImage ? 'rounded-xl rounded-br-sm' : 'rounded-xl'
                      } tooltip tooltip-left`
                    : `bg-base-200 ${
                        showProfileImage ? 'rounded-xl rounded-bl-sm' : 'rounded-xl'
                      } tooltip tooltip-right`
                }`}
                data-tip={formatMessageTime(message.createdAt)}
              >
                This message was deleted
              </div>
            ) : (
              <>
                {/* Media attachment if any */}
                {message.mediaUrl ? (
                  <div
                    className={`mb-2 tooltip ${isMyMessage ? 'tooltip-left' : 'tooltip-right'}`}
                    data-tip={formatMessageTime(message.createdAt)}
                  >
                    {message.messageType === MessageType.IMAGE && (
                      <img
                        src={
                          message.mediaUrl ||
                          '/placeholder.svg?height=250&width=250&query=image attachment'
                        }
                        alt={message.content || 'Image attachment'}
                        className="max-w-[250px] rounded-lg"
                        loading="lazy"
                      />
                    )}
                    {message.messageType === MessageType.GIF && (
                      <img
                        src={
                          message.mediaUrl ||
                          '/placeholder.svg?height=250&width=250&query=gif attachment'
                        }
                        alt={message.content || 'GIF attachment'}
                        className="max-w-[250px] rounded-lg"
                        loading="lazy"
                      />
                    )}
                    {message.messageType === MessageType.VIDEO && (
                      <video controls className="max-w-[250px] rounded-lg">
                        <source src={message.mediaUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {message.messageType === MessageType.AUDIO && (
                      <audio controls className="w-full max-w-[250px]">
                        <source
                          src={message.mediaUrl}
                          type={`audio/${message.mediaUrl.split('.').pop()}`}
                        />
                        Your browser does not support audio.
                      </audio>
                    )}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 break-words whitespace-pre-wrap relative tooltip ${
                      isMyMessage
                        ? `bg-primary text-primary-content ${
                            showProfileImage ? 'rounded-xl rounded-br-sm' : 'rounded-xl'
                          } tooltip-left`
                        : `bg-secondary text-secondary-content ${
                            showProfileImage ? 'rounded-xl rounded-bl-sm' : 'rounded-xl'
                          } tooltip-right`
                    }`}
                    style={{
                      wordBreak: 'break-word',
                      wordWrap: 'break-word',
                    }}
                    data-tip={formatMessageTime(message.createdAt)}
                  >
                    {/* Message content */}
                    {message.content && <div>{message.content}</div>}
                  </div>
                )}
              </>
            )}

            {/* MessageActions for other user's message (right of bubble) */}
            {!message.isDeleted && !isMyMessage && (
              <div className="absolute -right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="pointer-events-auto">
                  <MessageActions message={message} onEdit={() => setIsEditing(true)} />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right side - My profile image */}
        {isMyMessage && (
          <div className="flex-shrink-0 w-8 h-8">
            {showProfileImage && (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={senderInfo?.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Seen indicators */}
      {seenByUsers.length > 0 && (
        <div className={`flex mt-1 ${isMyMessage ? 'justify-end mr-10' : 'justify-start ml-10'}`}>
          <div className="flex flex-wrap gap-1 relative">
            {seenByUsers.slice(0, 5).map((userId) => {
              const participant = participantsInfo?.find((p) => p.id === userId)
              return (
                <div
                  key={userId}
                  className={`w-4 h-4 rounded-full border-2 border-base-100 tooltip ${
                    isMyMessage ? 'tooltip-left' : 'tooltip-right'
                  }`}
                  data-tip={`Seen by ${participant?.fullName || 'Unknown'} ${formatMessageTime(
                    message.readInfo?.find((r) => r.userId === userId)?.readAt || ''
                  )}`}
                >
                  <img
                    src={participant?.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                    alt="Seen"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )
            })}
            {seenByUsers.length > 5 && (
              <div
                className={`w-4 h-4 rounded-full bg-base-300 border-2 border-base-100 flex items-center justify-center tooltip ${
                  isMyMessage ? 'tooltip-left' : 'tooltip-right'
                }`}
                data-tip={`Seen by ${seenByUsers.length} people`}
              >
                <span className="text-xs text-base-content font-bold">
                  +{seenByUsers.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
