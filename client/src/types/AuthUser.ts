export type AuthUser = {
  id: string
  username: string
  email: string
  fullName?: string
  bio?: string
  profileImageUrl?: string
  emailVerified: boolean
  profileCompleted: boolean
  role: string
}
