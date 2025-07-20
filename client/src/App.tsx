import { Navigate, Route, Routes } from 'react-router'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect, useState } from 'react'
import Loading from '@/components/ui/loading'
import { useThemeStore } from '@/store/useThemeStore'
import MainLayout from '@/components/layout/MainLayout'
import HomePage from '@/pages/home/HomePage'
import SetupBasicInfoPage from '@/pages/auth/SetupBasicInfoPage'
import AuthLayout from '@/components/layout/AuthLayout'
import { useWebSocketStore } from './store/useWebSocketStore'
import FriendsPage from './pages/friend/FriendPage'

function App() {
  const { authUser, fetchAuthUser } = useAuthStore()
  const { theme } = useThemeStore()
  const { connect, disconnect } = useWebSocketStore()

  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = Boolean(authUser)
  const isProfileCompleted = authUser?.profileCompleted

  useEffect(() => {
    fetchAuthUser()
  }, [fetchAuthUser])

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Connect to WebSocket if the user is authenticated
  useEffect(() => {
    if (isAuthenticated && isProfileCompleted) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, isProfileCompleted, connect, disconnect])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div data-theme={theme}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              isAuthenticated && isProfileCompleted ? (
                <HomePage />
              ) : (
                <Navigate to={!isAuthenticated ? '/login' : '/setup-info'} />
              )
            }
          />
          <Route
            path="/update-profile"
            element={
              isAuthenticated && isProfileCompleted ? (
                <SetupBasicInfoPage />
              ) : (
                <Navigate to={!isAuthenticated ? '/login' : '/setup-info'} />
              )
            }
          />

          <Route
            path="/friends"
            element={
              isAuthenticated && isProfileCompleted ? (
                <FriendsPage />
              ) : (
                <Navigate to={!isAuthenticated ? '/login' : '/setup-info'} />
              )
            }
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={isProfileCompleted ? '/' : '/setup-info'} />
              )
            }
          />

          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <RegisterPage />
              ) : (
                <Navigate to={isProfileCompleted ? '/' : '/setup-info'} />
              )
            }
          />

          <Route
            path="/setup-info"
            element={
              isAuthenticated ? (
                !isProfileCompleted ? (
                  <SetupBasicInfoPage />
                ) : (
                  <Navigate to="/" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
