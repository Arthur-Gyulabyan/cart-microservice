import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { cartApi } from '@/api/cart-api';

export function AddItemDialog({ cartId }: { cartId: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      cartApi.addItemToCart(cartId, [
        {
          productId,
          productName,
          unitPrice: parseInt(unitPrice, 10),
          quantity: parseInt(quantity, 10),
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', cartId] });
      toast.success('Item added');
      setOpen(false);
      setProductId('');
      setProductName('');
      setUnitPrice('');
      setQuantity('1');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to Cart</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              placeholder="e.g. prod_501"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g. Wireless Headphones"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (cents)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                placeholder="e.g. 4999"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
