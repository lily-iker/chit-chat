import type { RelationshipStatus } from '../enum/RelationshipStatus'

export interface UserProfileResponse {
  id: string
  fullName: string
  profileImageUrl?: string
  bio?: string
  status: RelationshipStatus
}
