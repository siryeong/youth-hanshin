import { MenuItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type MenuItemWithCategory = MenuItem & {
  category: {
    name: string;
  };
};

/**
 * Menu Item Service
 * Handles all operations related to menu items
 */
export class MenuItemService {
  /**
   * Get all menu items with their categories
   * @param categoryId - Optional category ID to filter by
   * @returns Promise resolving to an array of menu items with their categories
   */
  async getAllMenuItems(categoryId?: number): Promise<MenuItemWithCategory[]> {
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: categoryId ? { categoryId } : undefined,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return menuItems;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw new Error('Failed to fetch menu items');
    }
  }

  /**
   * Get a menu item by ID with its category
   * @param id - The menu item ID
   * @returns Promise resolving to the menu item with its category or null if not found
   */
  async getMenuItemById(id: number): Promise<MenuItemWithCategory | null> {
    try {
      return await prisma.menuItem.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching menu item with ID ${id}:`, error);
      throw new Error(`Failed to fetch menu item with ID ${id}`);
    }
  }

  /**
   * Create a new menu item
   * @param data - The menu item data
   * @returns Promise resolving to the created menu item with its category
   */
  async createMenuItem(data: {
    name: string;
    description?: string | null;
    categoryId: number;
    imagePath?: string | null;
    isTemperatureRequired: boolean;
  }): Promise<MenuItemWithCategory> {
    try {
      return await prisma.menuItem.create({
        data: {
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId,
          imagePath: data.imagePath || null,
          isTemperatureRequired: data.isTemperatureRequired,
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw new Error('Failed to create menu item');
    }
  }

  /**
   * Update a menu item
   * @param id - The menu item ID
   * @param data - The updated menu item data
   * @returns Promise resolving to the updated menu item with its category
   */
  async updateMenuItem(
    id: number,
    data: {
      name?: string;
      description?: string;
      categoryId?: number;
      imagePath?: string;
      isTemperatureRequired?: boolean;
    },
  ): Promise<MenuItemWithCategory> {
    try {
      return await prisma.menuItem.update({
        where: { id },
        data,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error updating menu item with ID ${id}:`, error);
      throw new Error(`Failed to update menu item with ID ${id}`);
    }
  }

  /**
   * Delete a menu item
   * @param id - The menu item ID
   * @returns Promise resolving to the deleted menu item
   */
  async deleteMenuItem(id: number): Promise<MenuItem> {
    try {
      return await prisma.menuItem.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting menu item with ID ${id}:`, error);
      throw new Error(`Failed to delete menu item with ID ${id}`);
    }
  }

  /**
   * Check if a menu item is used in any orders
   * @param id - The menu item ID
   * @returns Promise resolving to a boolean indicating if the menu item is used in orders
   */
  async isMenuItemUsedInOrders(id: number): Promise<boolean> {
    try {
      const orderCount = await prisma.order.count({
        where: { menuItemId: id },
      });
      return orderCount > 0;
    } catch (error) {
      console.error(`Error checking if menu item with ID ${id} is used in orders:`, error);
      throw new Error(`Failed to check if menu item with ID ${id} is used in orders`);
    }
  }
}
