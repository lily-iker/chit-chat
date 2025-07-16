import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useVideoCallStore } from '@/store/useVideoCall'
import { useChatStore } from '@/store/useChatStore'
import {
  StreamCall,
  StreamVideo,
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
  StreamTheme,
  CallingState,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

const VideoCallContent = () => {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()

  const { endCall } = useVideoCallStore()

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      endCall()
    }
  }, [callingState, endCall])

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  )
}

const VideoCallModal = () => {
  const { client, call, isCallActive, endCall } = useVideoCallStore()
  const { selectedChat } = useChatStore()
  const modalRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isCallActive && modalRef.current) {
      modalRef.current.showModal()
    } else if (modalRef.current) {
      modalRef.current.close()
    }
  }, [isCallActive])

  const handleClose = () => {
    endCall()
  }

  if (!client || !call || !isCallActive) return null

  return (
    <dialog ref={modalRef} className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl h-5/6 p-0 bg-base-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={selectedChat?.chatImageUrl || '/avatar.png'} alt="Chat Avatar" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{selectedChat?.name}</h3>
              <p className="text-sm text-base-content/70">Video Call</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Call Content */}
        <div className="flex-1 p-4" style={{ height: 'calc(100% - 80px)' }}>
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <VideoCallContent />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}

export default VideoCallModal
