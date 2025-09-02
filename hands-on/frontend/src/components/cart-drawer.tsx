import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useCart, useRemoveFromCart, useUpdateCartItem } from '@/hooks/use-cart';
import { CartEmpty, CartError, CartSkeleton } from '@/components/cart-states';

function formatPriceBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { mutate: updateItem, isPending: updating } = useUpdateCartItem();
  const { mutate: removeItem, isPending: removing } = useRemoveFromCart();

  const totals = useMemo(
    () => ({
      count: cart?.totalItems ?? 0,
      price: cart?.totalPrice ?? 0,
    }),
    [cart]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-[420px]">
        <SheetHeader>
          <SheetTitle>Seu Carrinho</SheetTitle>
          <SheetDescription>
            Revise seus itens antes de finalizar a compra
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto mt-4 space-y-4">
          {isLoading && <CartSkeleton />}
          {isError && <CartError onRetry={() => refetch()} />}
          {!isLoading && !isError && cart && cart.items.length === 0 && <CartEmpty />}

          {!isLoading && !isError && cart && cart.items.length > 0 && (
            <div className="space-y-4">
              {cart.items.map((it) => (
                <div key={it.id} className="flex gap-3 items-center border p-3 rounded-md">
                  <div className="h-12 w-12 bg-muted rounded overflow-hidden">
                    {it.product.imageUrl ? (
                      <img
                        src={it.product.imageUrl.startsWith('http') ? it.product.imageUrl : `http://localhost:3005${it.product.imageUrl}`}
                        alt={it.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{it.product.name}</div>
                    <div className="text-sm text-muted-foreground">{formatPriceBRL(it.product.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={it.quantity}
                      min={1}
                      max={100}
                      onChange={(e) => {
                        const q = Math.max(1, Math.min(100, Number(e.target.value || 1)));
                        updateItem({ itemId: it.id, quantity: q });
                      }}
                      disabled={updating}
                    />
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeItem(it.id)}
                      disabled={removing}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Itens</span>
            <span>{totals.count}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPriceBRL(totals.price)}</span>
          </div>
          <Button className="w-full mt-2" disabled={!cart || cart.items.length === 0}>Finalizar Compra</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

