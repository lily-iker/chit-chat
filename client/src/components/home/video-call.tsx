import { useVideoCallStore } from '@/store/useVideoCall'
import { useEffect } from 'react'
import axios from '@/lib/axios-custom'
import { StreamCall, StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useAuthStore } from '@/store/useAuthStore'

type VideoCallProps = {
  callId: string
}

const VideoCall = ({ callId }: VideoCallProps) => {
  const { client, call, setClient, setCall } = useVideoCallStore()
  const { authUser } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      if (call) return
      if (!authUser) return

      const res = await axios.get(`/api/stream/token?userId=${authUser.id}`)
      const streamToken = res.data.result

      const streamClient = new StreamVideoClient({
        apiKey: process.env.VITE_STREAM_API_KEY as string,
        user: {
          id: authUser.id,
          name: authUser.fullName || authUser.username,
          image: authUser.profileImageUrl,
        },
        token: streamToken,
      })

      await streamClient.connectUser({ id: authUser.id })
      const newCall = streamClient.call('default', callId)

      setClient(streamClient)
      setCall(newCall)
    }

    init()
  }, [authUser, callId])

  if (!client || !call) return <div>Loading...</div>

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>{/* <CallContent /> */}</StreamCall>
    </StreamVideo>
  )
}

export default VideoCall
