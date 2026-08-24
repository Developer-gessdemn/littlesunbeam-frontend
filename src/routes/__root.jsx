import * as React from 'react'
import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return <Outlet />
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-4xl font-extrabold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Sorry, the page or product you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/85 transition"
        >
          Return to Home Page
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
