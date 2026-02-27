import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tag } from 'lucide-react';
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

export function ApplyCouponDialog({ cartId }: { cartId: string }) {
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cartApi.applyCoupon(cartId, couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', cartId] });
      toast.success('Coupon applied');
      setOpen(false);
      setCouponCode('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="mr-2 h-4 w-4" /> Apply Coupon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Coupon</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="couponCode">Coupon Code</Label>
            <Input
              id="couponCode"
              placeholder="e.g. SAVE10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              required
            />
            <p className="text-xs text-muted-foreground">
              Available codes: SAVE10, WELCOME20, SUMMER15
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Applying...' : 'Apply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
