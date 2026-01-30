'use client';

import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your bag.`,
    });
  };

  return (
    <Button 
      size="lg" 
      className="w-full h-14 rounded-none bg-primary text-white text-lg font-bold tracking-widest uppercase hover:bg-primary/90"
      onClick={handleAddToCart}
    >
      <ShoppingBag className="mr-2 h-5 w-5" /> Add To Bag
    </Button>
  );
}
