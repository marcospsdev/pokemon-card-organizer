import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { NewOrganizationSheet } from '@/components/layout/NewOrganizationSheet'
import { Toaster } from '@/components/ui/Toast'
import { HomePage } from '@/pages/HomePage'

const OrganizationsPage = lazy(() => import('@/pages/OrganizationsPage').then((module) => ({ default: module.OrganizationsPage })))
const OrganizationSummaryPage = lazy(() => import('@/pages/OrganizationSummaryPage').then((module) => ({ default: module.OrganizationSummaryPage })))
const ScannerPage = lazy(() => import('@/pages/ScannerPage').then((module) => ({ default: module.ScannerPage })))
const SortingPage = lazy(() => import('@/pages/SortingPage').then((module) => ({ default: module.SortingPage })))
const CompletedPage = lazy(() => import('@/pages/CompletedPage').then((module) => ({ default: module.CompletedPage })))
const PokedexPage = lazy(() => import('@/pages/PokedexPage').then((module) => ({ default: module.PokedexPage })))
const PokedexDetailPage = lazy(() => import('@/pages/PokedexDetailPage').then((module) => ({ default: module.PokedexDetailPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

function RootLayout() {
  return (
    <>
      <Suspense fallback={<div className='min-h-dvh' aria-busy='true' />}>
        <Outlet />
      </Suspense>
      <NewOrganizationSheet />
      <Toaster />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'organizations', element: <OrganizationsPage /> },
          { path: 'organizations/:id', element: <OrganizationSummaryPage /> },
          { path: 'pokedex', element: <PokedexPage /> },
          { path: 'pokedex/:id', element: <PokedexDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      { path: 'organizations/:id/scan', element: <ScannerPage /> },
      { path: 'organizations/:id/sort', element: <SortingPage /> },
      { path: 'organizations/:id/done', element: <CompletedPage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion='user'>
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  )
}
