import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  XCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddItemDialog } from '@/components/AddItemDialog';
import { ApplyCouponDialog } from '@/components/ApplyCouponDialog';
import { cartApi } from '@/api/cart-api';
import { formatCents, formatDate } from '@/lib/format';
import type { Cart, CartStatus } from '@/types/cart';

const statusVariant: Record<CartStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  checking_out: 'secondary',
  checked_out: 'outline',
  abandoned: 'destructive',
};

export function CartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart', id],
    queryFn: () => cartApi.getCartById(id!),
    enabled: !!id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart', id] });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: string) => cartApi.removeItemFromCart(id!, cartItemId),
    onSuccess: () => { invalidate(); toast.success('Item removed'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const quantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      cartApi.updateItemQuantity(id!, cartItemId, quantity),
    onSuccess: () => { invalidate(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const validateMutation = useMutation({
    mutationFn: () => cartApi.validateCart(id!),
    onSuccess: () => { invalidate(); toast.success('Cart validated'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => cartApi.initiateCheckout(id!),
    onSuccess: () => { invalidate(); toast.success('Checkout initiated'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const placeOrderMutation = useMutation({
    mutationFn: () => cartApi.placeOrder(id!, 'pm_default'),
    onSuccess: () => { invalidate(); toast.success('Order placed'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const abandonMutation = useMutation({
    mutationFn: () => cartApi.abandonCart(id!),
    onSuccess: () => { invalidate(); toast.success('Cart abandoned'); },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;
  if (!cart) return null;

  const isActive = cart.status === 'active';
  const isCheckingOut = cart.status === 'checking_out';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/carts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Cart Details</h1>
      </div>

      {/* Cart Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Cart ID" value={cart.id} mono />
        <InfoCard label="Customer" value={cart.customerId} mono />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={statusVariant[cart.status]} className="mt-1">
              {cart.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Summary</CardTitle>
          <span className="text-sm text-muted-foreground">
            {cart.currency} &middot; {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="Subtotal" value={formatCents(cart.subtotal, cart.currency)} />
          {cart.discountAmount > 0 && (
            <Row
              label={`Discount${cart.coupon ? ` (${cart.coupon.code})` : ''}`}
              value={`-${formatCents(cart.discountAmount, cart.currency)}`}
              className="text-green-600"
            />
          )}
          <Separator />
          <Row label="Total" value={formatCents(cart.totalAmount, cart.currency)} bold />
          <div className="pt-2 text-xs text-muted-foreground">
            Created {formatDate(cart.createdAt)} &middot; Updated {formatDate(cart.updatedAt)}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Items</CardTitle>
          {isActive && <AddItemDialog cartId={cart.id} />}
        </CardHeader>
        <CardContent>
          {cart.items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No items in this cart.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  {isActive && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>{item.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.productId}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCents(item.unitPrice, cart.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              quantityMutation.mutate({
                                cartItemId: item.id,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="w-8 text-center">{item.quantity}</span>
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              quantityMutation.mutate({
                                cartItemId: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCents(item.subtotal, cart.currency)}
                    </TableCell>
                    {isActive && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {(isActive || isCheckingOut) && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isActive && (
              <>
                <ApplyCouponDialog cartId={cart.id} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Validate
                </Button>
                <Button
                  size="sm"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending || cart.items.length === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => abandonMutation.mutate()}
                  disabled={abandonMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Abandon
                </Button>
              </>
            )}
            {isCheckingOut && (
              <Button
                size="sm"
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Place Order
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 font-medium ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-lg' : ''} ${className ?? ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
