import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthGuard } from '@router/AuthGuard';
import { SplashScreen } from '@ui/components/SplashScreen';
import { AppLayout } from '@ui/layouts/AppLayout';
import { AuthLayout } from '@ui/layouts/AuthLayout';

const SignIn = lazy(() => import('@ui/pages/SignIn'));
const SignUp = lazy(() => import('@ui/pages/SignUp'));
const VerifyEmail = lazy(() => import('@ui/pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('@ui/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@ui/pages/ResetPassword'));
const OAuthCallback = lazy(() => import('@ui/pages/OAuthCallback'));
const Home = lazy(() => import('@ui/pages/Home'));

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <Suspense fallback={<SplashScreen />}><OAuthCallback /></Suspense>,
  },
  {
    element: <AuthGuard isPrivate={false} />,
    children: [{
      element: <AuthLayout />,
      children: [
        { path: '/sign-in', element: <SignIn /> },
        { path: '/sign-up', element: <SignUp /> },
        { path: '/verify-email', element: <VerifyEmail /> },
        { path: '/forgot-password', element: <ForgotPassword /> },
        { path: '/reset-password', element: <ResetPassword /> },
      ],
    }],
  },
  {
    element: <AuthGuard isPrivate />,
    children: [{
      element: <AppLayout />,
      children: [{ index: true, element: <Home /> }],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
