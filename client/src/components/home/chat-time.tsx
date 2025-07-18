import { useLiveTime } from '@/hooks/useLiveTime'

interface ChatTimeProps {
  timestamp: string
  className?: string
}

/**
 * Component that displays chat time and automatically updates as time passes
 */
const ChatTime = ({ timestamp, className = '' }: ChatTimeProps) => {
  const formattedTime = useLiveTime(timestamp)

  return <span className={className}>{formattedTime}</span>
}

export default ChatTime
