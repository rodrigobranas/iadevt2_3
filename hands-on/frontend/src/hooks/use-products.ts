import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  sku: z.string(),
  createdAt: z.string(),
});

export const productsSchema = z.array(productSchema);
export type Product = z.infer<typeof productSchema>;

export const productImageSchema = z.object({
  id: z.string(),
  productId: z.string(),
  url: z.string(),
  position: z.number(),
  createdAt: z.string(),
});

export const productImagesSchema = z.array(productImageSchema);
export type ProductImage = z.infer<typeof productImageSchema>;

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  sku: z.string().min(1, 'SKU é obrigatório'),
});

export type CreateProductData = z.infer<typeof createProductSchema>;

export const updateProductInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  sku: z.string().min(1, 'SKU é obrigatório'),
});

export type UpdateProductData = z.infer<typeof updateProductInputSchema>;

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  
  if (!response.ok) {
    throw new Error('Erro ao buscar produtos');
  }
  
  const data = await response.json();
  return productsSchema.parse(data);
}

async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar produto');
  }
  
  const product = await response.json();
  return productSchema.parse(product);
}

async function updateProduct({ id, data }: { id: string; data: UpdateProductData }): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar produto');
  }
  
  const product = await response.json();
  return productSchema.parse(product);
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar produto');
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Product Images API functions
async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(`/api/products/${productId}/images`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar imagens do produto');
  }
  
  const data = await response.json();
  return productImagesSchema.parse(data);
}

async function uploadProductImages(productId: string, files: File[]): Promise<ProductImage[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  
  const response = await fetch(`/api/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao fazer upload das imagens');
  }
  
  const images = await response.json();
  return productImagesSchema.parse(images);
}

async function deleteProductImage({ productId, imageId }: { productId: string; imageId: string }): Promise<void> {
  const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar imagem');
  }
}

// Product Images hooks
export function useProductImages(productId: string) {
  return useQuery({
    queryKey: ['productImages', productId],
    queryFn: () => fetchProductImages(productId),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

export function useUploadProductImages(productId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (files: File[]) => uploadProductImages(productId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProductImage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productImages', variables.productId] });
    },
  });
}