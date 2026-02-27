import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateCartDialog } from '@/components/CreateCartDialog';
import { cartApi } from '@/api/cart-api';
import { formatCents, formatDate } from '@/lib/format';
import type { CartStatus } from '@/types/cart';

const statusVariant: Record<CartStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  checking_out: 'secondary',
  checked_out: 'outline',
  abandoned: 'destructive',
};

export function CartsPage() {
  const [customerId, setCustomerId] = useState('');
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const { data: carts, isLoading, error } = useQuery({
    queryKey: ['carts', searchId],
    queryFn: () => cartApi.getAllCarts(searchId),
    enabled: !!searchId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carts</h1>
        <CreateCartDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search by Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchId(customerId);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Enter customer ID (e.g. cust_101)"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}

      {carts && carts.length === 0 && (
        <p className="text-muted-foreground">No carts found for this customer.</p>
      )}

      {carts && carts.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cart ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.map((cart) => (
                <TableRow
                  key={cart.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/carts/${cart.id}`)}
                >
                  <TableCell className="font-mono text-sm">{cart.id}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[cart.status]}>{cart.status}</Badge>
                  </TableCell>
                  <TableCell>{cart.itemCount}</TableCell>
                  <TableCell className="text-right">
                    {formatCents(cart.totalAmount, cart.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(cart.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
