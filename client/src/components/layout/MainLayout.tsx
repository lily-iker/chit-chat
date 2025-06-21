import { Outlet } from 'react-router'
import Navbar from './Navbar'
import useIsMobile from '@/hooks/useIsMobile'
import MobileNavbar from './MobileNavbar'

const MainLayout = () => {
  const isMobile = useIsMobile()

  return (
    <main className="h-screen flex flex-col">
      {!isMobile && <Navbar />}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      {isMobile && <MobileNavbar />}
    </main>
  )
}

export default MainLayout
