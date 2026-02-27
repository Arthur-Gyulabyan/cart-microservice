import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CartsPage } from '@/pages/CartsPage';
import { CartDetailPage } from '@/pages/CartDetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/carts" replace />} />
        <Route path="/carts" element={<CartsPage />} />
        <Route path="/carts/:id" element={<CartDetailPage />} />
      </Route>
    </Routes>
  );
}
