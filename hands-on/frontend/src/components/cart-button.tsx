import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';

export function CartButton({ onClick }: { onClick: () => void }) {
  const { data: cart, isLoading } = useCart();
  const itemCount = cart?.totalItems ?? 0;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="relative"
      disabled={isLoading}
      aria-label="Abrir carrinho"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );
}

