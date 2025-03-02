'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from './menu-data';

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

interface OrderContextType {
  orderItems: OrderItem[];
  addToOrder: (menuItem: MenuItem) => void;
  removeFromOrder: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearOrder: () => void;
  totalAmount: number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.menuItem.id === menuItem.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        return [...prevItems, { menuItem, quantity: 1 }];
      }
    });
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems((prevItems) => prevItems.filter((item) => item.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(menuItemId);
      return;
    }

    setOrderItems((prevItems) =>
      prevItems.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item)),
    );
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const totalAmount = orderItems.reduce(
    (total, item) => total + item.menuItem.price * item.quantity,
    0,
  );

  return (
    <OrderContext.Provider
      value={{
        orderItems,
        addToOrder,
        removeFromOrder,
        updateQuantity,
        clearOrder,
        totalAmount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
