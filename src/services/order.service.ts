import { Order } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type OrderWithRelations = Order & {
  village: {
    id: number;
    name: string;
  };
  menuItem: {
    id: number;
    name: string;
  };
};

type CreateOrderData = {
  villageId: number;
  menuItemId: number;
  memberName: string;
  isCustomName: boolean;
  temperature?: string | null;
  isMild?: boolean;
  status?: string;
};

/**
 * Order Service
 * Handles all operations related to orders
 */
export class OrderService {
  /**
   * Get all orders with their relations
   * @returns Promise resolving to an array of orders with their relations
   */
  async getAllOrders(): Promise<OrderWithRelations[]> {
    try {
      return await prisma.order.findMany({
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get an order by ID with its relations
   * @param id - The order ID
   * @returns Promise resolving to the order with its relations or null if not found
   */
  async getOrderById(id: number): Promise<OrderWithRelations | null> {
    try {
      return await prisma.order.findUnique({
        where: { id },
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      throw new Error(`Failed to fetch order with ID ${id}`);
    }
  }

  /**
   * Create a new order
   * @param data - The order data
   * @returns Promise resolving to the created order with its relations
   */
  async createOrder(data: CreateOrderData): Promise<OrderWithRelations> {
    try {
      // Verify that the village exists
      const village = await prisma.village.findUnique({
        where: { id: data.villageId },
      });
      if (!village) {
        throw new Error(`Village with ID ${data.villageId} not found`);
      }

      // Verify that the menu item exists
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: data.menuItemId },
      });
      if (!menuItem) {
        throw new Error(`Menu item with ID ${data.menuItemId} not found`);
      }

      // Create the order
      return await prisma.order.create({
        data: {
          villageId: data.villageId,
          menuItemId: data.menuItemId,
          memberName: data.memberName,
          isCustomName: data.isCustomName,
          temperature: data.temperature || null,
          isMild: data.isMild || false,
          status: data.status || 'pending',
        },
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an order
   * @param id - The order ID
   * @param data - The updated order data
   * @returns Promise resolving to the updated order with its relations
   */
  async updateOrder(id: number, data: Partial<CreateOrderData>): Promise<OrderWithRelations> {
    try {
      return await prisma.order.update({
        where: { id },
        data,
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error updating order with ID ${id}:`, error);
      throw new Error(`Failed to update order with ID ${id}`);
    }
  }

  /**
   * Update the status of an order
   * @param id - The order ID
   * @param status - The new status
   * @returns Promise resolving to the updated order with its relations
   */
  async updateOrderStatus(id: number, status: string): Promise<OrderWithRelations> {
    try {
      return await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error updating status for order with ID ${id}:`, error);
      throw new Error(`Failed to update status for order with ID ${id}`);
    }
  }

  /**
   * Delete an order
   * @param id - The order ID
   * @returns Promise resolving to the deleted order
   */
  async deleteOrder(id: number): Promise<Order> {
    try {
      return await prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting order with ID ${id}:`, error);
      throw new Error(`Failed to delete order with ID ${id}`);
    }
  }

  /**
   * Check for duplicate orders
   * @param villageId - The village ID
   * @param memberName - The member name
   * @returns Promise resolving to true if a duplicate exists, false otherwise
   */
  async checkDuplicateOrder(villageId: number, memberName: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingOrder = await prisma.order.findFirst({
        where: {
          villageId,
          memberName,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      return !!existingOrder;
    } catch (error) {
      console.error('Error checking for duplicate order:', error);
      throw new Error('Failed to check for duplicate order');
    }
  }

  /**
   * Get duplicate order details
   * @param villageId - The village ID
   * @param memberName - The member name
   * @param date - Optional date to check for duplicates (defaults to today)
   * @returns Promise resolving to the duplicate order with its relations or null if not found
   */
  async getDuplicateOrderDetails(villageId: number, memberName: string, date?: Date): Promise<OrderWithRelations | null> {
    try {
      // Set date range (start of day to end of day)
      const checkDate = date || new Date();
      const startDate = new Date(checkDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(checkDate);
      endDate.setHours(23, 59, 59, 999);

      // Find the most recent order for this member in this village on the given date
      const duplicateOrder = await prisma.order.findFirst({
        where: {
          villageId,
          memberName,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          village: {
            select: {
              id: true,
              name: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return duplicateOrder;
    } catch (error) {
      console.error('Error getting duplicate order details:', error);
      throw new Error('Failed to get duplicate order details');
    }
  }
}
