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

export function CreateCartDialog() {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cartApi.createCart(customerId, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Cart created');
      setOpen(false);
      setCustomerId('');
      setCurrency('USD');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Cart
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Cart</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input
              id="customerId"
              placeholder="e.g. cust_101"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              placeholder="e.g. USD"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
