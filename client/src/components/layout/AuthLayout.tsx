import { Outlet } from 'react-router'
import AuthNavbar from './AuthNavbar'

const AuthLayout = () => {
  return (
    <main className="min-h-screen">
      <AuthNavbar />

      <Outlet />
    </main>
  )
}

export default AuthLayout
