import { Users } from 'lucide-react'
import { useNavigate } from 'react-router'

const FriendButton = () => {
  const navigate = useNavigate()

  return (
    <div>
      <button tabIndex={0} className="btn btn-ghost" onClick={() => navigate('/friends')}>
        <Users className="size-5" />
        <span className="hidden sm:inline">Friend</span>
      </button>
    </div>
  )
}

export default FriendButton
