import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Link to="/carts" className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            Cart Microservice
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
