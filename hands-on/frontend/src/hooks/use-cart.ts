import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionId } from '@/lib/session';

export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    sku: z.string(),
    imageUrl: z.string().nullable(),
  }),
  createdAt: z.string().optional().catch(''),
  updatedAt: z.string().optional().catch(''),
});

export const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  items: z.array(cartItemSchema),
  totalItems: z.number().int(),
  totalPrice: z.number(),
  createdAt: z.string().optional().catch(''),
  updatedAt: z.string().optional().catch(''),
});

const fetchCart = async (): Promise<z.infer<typeof cartSchema>> => {
  const sessionId = getSessionId();
  const response = await fetch(`/api/cart/${sessionId}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar carrinho');
  }
  const data = await response.json();
  return cartSchema.parse({
    ...data,
    items: data.items ?? [],
    totalItems: data.totalItems ?? 0,
    totalPrice: data.totalPrice ?? 0,
  });
};

const addToCartAPI = async ({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) => {
  const sessionId = getSessionId();
  // Ensure cart exists and get id
  const cartResp = await fetch(`/api/cart/${sessionId}`);
  const cart = await cartResp.json();
  const response = await fetch(`/api/cart/${cart.id}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!response.ok) {
    throw new Error('Erro ao adicionar item ao carrinho');
  }
  return response.json();
};

const updateCartItemAPI = async ({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) => {
  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) {
    throw new Error('Erro ao atualizar item');
  }
  return response.json();
};

const removeFromCartAPI = async (itemId: string) => {
  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erro ao remover item');
  }
  return response.json();
};

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToCartAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartItemAPI,
    onMutate: async ({ itemId, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<z.infer<typeof cartSchema>>(['cart']);
      
      // Optimistically update the cart
      if (previousCart) {
        const updatedCart = {
          ...previousCart,
          items: previousCart.items.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          ),
        };
        // Recalculate totals
        updatedCart.totalItems = updatedCart.items.reduce((sum, it) => sum + it.quantity, 0);
        updatedCart.totalPrice = updatedCart.items.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
        
        queryClient.setQueryData(['cart'], updatedCart);
      }
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromCartAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

