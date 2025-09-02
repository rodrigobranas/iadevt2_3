import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductImages, type Product } from '@/hooks/use-products';
import { Heart, Minus, Plus, Truck, RotateCcw, Star } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPriceBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { data: images = [] } = useProductImages(product?.id || '');

  useEffect(() => {
    if (open) {
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [open]);

  if (!product) return null;

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://localhost:3005${url}`;
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const selectedImage = images[selectedImageIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1200px] xl:max-w-[1200px] p-4 sm:p-6 lg:p-8" showCloseButton>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left side - Images */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2 sm:gap-3 lg:gap-4 overflow-x-auto sm:overflow-x-visible">
              {images.slice(0, 4).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:w-[100px] lg:h-[100px] xl:w-[120px] xl:h-[120px] rounded overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img
                    src={getFullImageUrl(image.url)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ESem imagem%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </button>
              ))}
              {images.length === 0 &&
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:w-[100px] lg:h-[100px] xl:w-[120px] xl:h-[120px] rounded bg-muted flex items-center justify-center"
                  >
                    <span className="text-muted-foreground text-sm">Sem imagem</span>
                  </div>
                ))}
            </div>

            {/* Main Image */}
            <div className="w-full sm:w-[400px] md:w-[450px] lg:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded overflow-hidden bg-muted flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={getFullImageUrl(selectedImage.url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ESem imagem%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <span className="text-muted-foreground">Sem imagem disponível</span>
              )}
            </div>
          </div>

          {/* Right side - Product Info */}
          <div className="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-6">
            {/* Title */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">{product.name}</h2>

            {/* Rating and Stock */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${
                      index < 4
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">(150 Reviews)</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-green-500">Em Estoque</span>
            </div>

            {/* Price */}
            <div className="text-xl sm:text-2xl font-medium">{formatPriceBRL(product.price)}</div>

            {/* Description */}
            <p className="text-muted-foreground">{product.description}</p>

            {/* Horizontal line */}
            <div className="border-t" />

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-20 h-10 flex items-center justify-center border-y">
                  <span className="font-medium">{quantity}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex-1 h-10 text-sm sm:text-base">Adicionar ao Carrinho</Button>
              <Button variant="outline" size="icon" className="hidden sm:flex">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="flex flex-col gap-3 border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Entrega Grátis</span>
                  <span className="text-sm text-muted-foreground">
                    Digite seu CEP para verificar disponibilidade
                  </span>
                </div>
              </div>
              <div className="border-t" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded flex items-center justify-center">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Devolução Grátis</span>
                  <span className="text-sm text-muted-foreground">
                    30 dias para devolução. Detalhes
                  </span>
                </div>
              </div>
            </div>

            {/* SKU Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">SKU:</span>
              <Badge variant="secondary">{product.sku}</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}