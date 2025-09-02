import { useState } from 'react';
import { ProductsPage } from '@/pages/products-page';
import { CartButton } from '@/components/cart-button';
import { CartDrawer } from '@/components/cart-drawer';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Minha Loja</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>

      <main>
        <ProductsPage />
      </main>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
