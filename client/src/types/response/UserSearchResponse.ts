import type { RelationshipStatus } from '../enum/RelationshipStatus'

export interface UserSearchResponse {
  id: string
  fullName: string
  profileImageUrl: string
  relationshipStatus: RelationshipStatus
}
