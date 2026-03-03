import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/theme-provider'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import useCartStore from './store/cartStore'

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
      fetchCart()
    }
  }, [isAuthenticated, fetchCart, fetchUser])

  return (
    <ThemeProvider defaultTheme="light" storageKey="edisonkart-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  )
}

export default App