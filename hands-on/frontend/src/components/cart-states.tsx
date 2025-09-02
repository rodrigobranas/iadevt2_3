import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertCircle, RefreshCw } from 'lucide-react';

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Erro ao carregar carrinho</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-2">
          <RefreshCw className="h-3 w-3 mr-1" />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">Seu carrinho está vazio</h3>
      <p className="text-sm text-muted-foreground mb-4">Adicione alguns produtos para começar suas compras</p>
      <Button variant="outline" onClick={() => (window.location.href = '/')}>Continuar Comprando</Button>
    </div>
  );
}

