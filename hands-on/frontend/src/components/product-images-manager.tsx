import { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/kibo-ui/dropzone';
import { 
  useProductImages, 
  useUploadProductImages, 
  useDeleteProductImage
} from '@/hooks/use-products';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductImagesManagerProps {
  productId: string;
  productName: string;
}

export function ProductImagesManager({ productId, productName }: ProductImagesManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: images = [], isLoading } = useProductImages(productId);
  const { mutate: uploadImages } = useUploadProductImages(productId);
  const { mutate: deleteImage, isPending: isDeleting } = useDeleteProductImage();

  const handleDrop = (acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    uploadImages(selectedFiles, {
      onSuccess: () => {
        toast.success('Imagens enviadas com sucesso!');
        setSelectedFiles([]);
      },
      onError: (error) => {
        toast.error(`Erro ao enviar imagens: ${error.message}`);
      },
      onSettled: () => {
        setIsUploading(false);
      },
    });
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImage(
      { productId, imageId },
      {
        onSuccess: () => {
          toast.success('Imagem removida com sucesso!');
        },
        onError: (error) => {
          toast.error(`Erro ao remover imagem: ${error.message}`);
        },
      }
    );
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://localhost:3005${url}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Imagens do Produto</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gerencie as imagens de "{productName}"
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-2">
        <Dropzone
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
          }}
          maxFiles={5}
          maxSize={5 * 1024 * 1024} // 5MB
          onDrop={handleDrop}
          src={selectedFiles}
          disabled={isUploading}
          className={cn(
            "border-dashed",
            selectedFiles.length > 0 && "border-primary"
          )}
        >
          {selectedFiles.length > 0 ? (
            <DropzoneContent />
          ) : (
            <DropzoneEmptyState />
          )}
        </Dropzone>

        {selectedFiles.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Enviando...' : `Enviar ${selectedFiles.length} imagem(ns)`}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedFiles([])}
              disabled={isUploading}
            >
              Limpar
            </Button>
          </div>
        )}
      </div>

      {/* Existing Images */}
      <div>
        <h4 className="text-sm font-medium mb-2">Imagens Atuais</h4>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Carregando imagens...
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma imagem cadastrada ainda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group border rounded-lg overflow-hidden"
              >
                <img
                  src={getFullImageUrl(image.url)}
                  alt={`Imagem ${image.position + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3EImagem%3C/text%3E%3C/svg%3E';
                  }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={isDeleting}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                  Posição {image.position + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
