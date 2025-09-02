import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { ProductModal } from '@/components/product-modal';
import { useDeleteProduct, useProductImages, type Product } from '@/hooks/use-products';
import { useAddToCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { Pencil, Trash2, ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

function formatPriceBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

export function ProductCard({ product }: ProductCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { data: images = [] } = useProductImages(product.id);
  const addToCart = useAddToCart();

  const handleDelete = () => {
    deleteProduct(product.id, {
      onError: (error) => {
        console.error('Erro ao deletar produto:', error);
      },
    });
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://localhost:3005${url}`;
  };

  const firstImage = images[0];

  return (
    <>
      <Card 
        className="h-full flex flex-col overflow-hidden p-0 gap-0 cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={() => setModalOpen(true)}
      >
        {/* Product Image */}
        {firstImage ? (
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            <img
              src={getFullImageUrl(firstImage.url)}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ESem imagem%3C/text%3E%3C/svg%3E';
              }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                +{images.length - 1} {images.length - 1 === 1 ? 'imagem' : 'imagens'}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <CardHeader className="flex-1 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {product.description}
              </CardDescription>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o produto "{product.name}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatPriceBRL(product.price)}
            </span>
            <Badge variant="secondary">
              {product.sku}
            </Badge>
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart.mutate(
                { productId: product.id, quantity: 1 },
                {
                  onSuccess: () => toast.success('Produto adicionado ao carrinho!'),
                  onError: () => toast.error('Erro ao adicionar produto ao carrinho'),
                }
              );
            }}
            disabled={addToCart.isPending}
            className="w-full mt-4"
          >
            {addToCart.isPending ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </Button>
        </CardContent>
      </Card>

      <EditProductDialog
        product={product}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      
      <ProductModal
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
