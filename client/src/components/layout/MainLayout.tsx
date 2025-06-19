import { Outlet } from 'react-router'
import Navbar from './Navbar'
import useIsMobile from '@/hooks/useIsMobile'

const MainLayout = () => {
  const isMobile = useIsMobile()

  return (
    <main className="min-h-screen">
      {!isMobile && <Navbar />}

      <Outlet />
    </main>
  )
}

export default MainLayout
