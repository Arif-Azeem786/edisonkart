import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'
import DeliveryLayout from './components/layout/DeliveryLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingScreen from './components/ui/loading-screen'
import DeliveryRoute from './components/pages/delivery/DeliveryRoute'
import CompletedOrders from './components/pages/delivery/CompletedOrders'

// Lazy load pages for better performance
const FAQ = lazy(() => import('./components/pages/FAQ'))
const Home = lazy(() => import('./components/pages/Home'))
const ProductListing = lazy(() => import('./components/pages/ProductListing'))
const ProductDetails = lazy(() => import('./components/product/ProductDetails'))
const Cart = lazy(() => import('./components/pages/Cart'))
const PaymentStatus = lazy(() => import('./components/pages/PaymentStatus'))


const OrderHistory = lazy(() => import('./components/pages/OrderHistory'))
const Login = lazy(() => import('./components/pages/Login'))
const Register = lazy(() => import('./components/pages/Register'))
const VerifyOTP = lazy(() => import('./components/pages/VerifyOTP'))
const About = lazy(() => import('./components/pages/About'))
const Contact = lazy(() => import('./components/pages/Contact'))
const Wishlist = lazy(() => import('./components/pages/Wishlist'))
const Notifications = lazy(() => import('./components/pages/Notifications'))
import Terms from './components/pages/Terms'
import Privacy from './components/pages/Privacy'
import Profile from './components/pages/Profile'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'
import NotFound from './components/pages/404'
const Checkout = lazy(() => import('./components/pages/Checkout'))
const OrderDetailsPage = lazy(() => import('./components/pages/OrderDetails'))
const ImportProduct = lazy(() => import('./components/pages/ImportProduct'))
// Admin pages
const AdminDashboard = lazy(() => import('./components/pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./components/pages/admin/Products'))
const AdminCategories = lazy(() => import('./components/pages/admin/Categories'))
const AdminOrders = lazy(() => import('./components/pages/admin/Orders'))
const AdminUsers = lazy(() => import('./components/pages/admin/Users'))
const AdminContactSubmissions = lazy(() => import('./components/pages/admin/ContactSubmissions'))
const AdminBanners = lazy(() => import('./components/pages/admin/Banners'))
const AdminCoupons = lazy(() => import('./components/admin/AdminCoupons'))
const AdminReturns = lazy(() => import('./components/admin/AdminReturns'))
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'))

// Delivery pages
const DeliveryDashboard = lazy(() => import('./components/pages/delivery/Dashboard'))
const DeliveryOrders = lazy(() => import('./components/pages/delivery/AssignedOrders'))

const withSuspense = (Component) => (
    <Suspense fallback={<LoadingScreen />}>
        <Component />
    </Suspense>
)

function RouteErrorFallback() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground text-center max-w-md">This page hit an error. Try refreshing or go back home.</p>
            <a href="/" className="text-primary hover:underline">Go to homepage</a>
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Refresh</button>
        </div>
    )
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <RouteErrorFallback />,
        children: [
            { index: true, element: withSuspense(Home) },
            { path: 'products', element: withSuspense(ProductListing) },
            { path: 'products/:slug', element: withSuspense(ProductDetails) },
            { path: 'product/:id', element: withSuspense(ProductDetails) },
            { path: 'cart', element: withSuspense(Cart) },
            { path: 'about', element: withSuspense(About) },
            { path: 'contact', element: withSuspense(Contact) },
            { path: 'faq', element: withSuspense(FAQ) },
            { path: 'terms', element: withSuspense(Terms) },
            { path: 'privacy', element: withSuspense(Privacy) },
            { path: 'login', element: withSuspense(Login) },
            { path: 'register', element: withSuspense(Register) },
            { path: 'verify-otp', element: withSuspense(VerifyOTP) },
            { path: 'forgot-password', element: withSuspense(ForgotPassword) },
            { path: 'reset-password/:token', element: withSuspense(ResetPassword) },
            {
                path: 'profile',
                element: <ProtectedRoute>{withSuspense(Profile)}</ProtectedRoute>
            },
            {
                path: 'checkout',
                element: (
                    <ProtectedRoute>
                        {withSuspense(Checkout)}
                    </ProtectedRoute>
                )
            },

            {
                path: 'orders',
                element: (
                    <ProtectedRoute>
                        {withSuspense(OrderHistory)}
                    </ProtectedRoute>
                )
            },

            {
                path: 'orders/:orderId',
                element: (
                    <ProtectedRoute>
                        {withSuspense(OrderDetailsPage)}
                    </ProtectedRoute>
                )
            },

            {
                path: 'payment-status',
                element: (
                    <ProtectedRoute>
                        {withSuspense(PaymentStatus)}
                    </ProtectedRoute>
                )
            },
            { path: 'wishlist', element: (
                <ProtectedRoute>
                    {withSuspense(Wishlist)}
                </ProtectedRoute>
            ) },
            {
                path: 'notifications',
                element: (
                    <ProtectedRoute>
                        {withSuspense(Notifications)}
                    </ProtectedRoute>
                )
            },
            {
                path: 'import-product',
                element: (
                    <ProtectedRoute>
                        {withSuspense(ImportProduct)}
                    </ProtectedRoute>
                )
            },
            // Catch-all 404 route - MUST BE LAST
            { path: '*', element: withSuspense(NotFound) }
        ],
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: withSuspense(AdminDashboard) },
            { path: 'products', element: withSuspense(AdminProducts) },
            { path: 'categories', element: withSuspense(AdminCategories) },
            { path: 'orders', element: withSuspense(AdminOrders) },
            { path: 'users', element: withSuspense(AdminUsers) },
            { path: 'contact', element: withSuspense(AdminContactSubmissions) },
            { path: 'banners', element: withSuspense(AdminBanners) },
            { path: 'coupons', element: withSuspense(AdminCoupons) },
            { path: 'returns', element: withSuspense(AdminReturns) },
            { path: 'settings', element: withSuspense(AdminSettings) },
        ],
    },
    {
        path: '/delivery',
        element: (
            <ProtectedRoute requiredRole="DELIVERY">
                <DeliveryLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: withSuspense(DeliveryDashboard) },
            { path: 'orders', element: withSuspense(DeliveryOrders) },
            { path: 'route', element: withSuspense(DeliveryRoute) },
            { path: 'completed', element: withSuspense(CompletedOrders) },
        ],
    },
])