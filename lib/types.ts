export interface Flower {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

export interface CartItem {
  flowerId: string;
  flowerName: string;
  price: number;
  imageUrl: string;
  stock: number;
  quantity: number;
}

export interface OrderItem {
  flowerId: string;
  flowerName: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  contactNumber: string;
  address: string;
  notes?: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}