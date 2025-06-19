import { Outlet } from 'react-router'
import AuthNavbar from './AuthNavbar'
// import Footer from "./footer"

const AuthLayout = () => {
  return (
    <main className="min-h-screen">
      <AuthNavbar />

      <Outlet />

      {/* <Footer /> */}
    </main>
  )
}

export default AuthLayout
