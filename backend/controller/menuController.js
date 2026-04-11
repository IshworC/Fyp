import Menu from '../models/Menu.js';
import Venue from '../models/Venue.js';

// ===== MENU OPERATIONS =====

// Create a new menu
export const createMenu = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { name, description, items } = req.body;

    // Verify venue exists and belongs to user
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add menu to this venue'
      });
    }

    const menu = await Menu.create({
      venue: venueId,
      owner: req.userId,
      name,
      description,
      items: items || []
    });

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      menu
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu',
      error: error.message
    });
  }
};

// Get all menus for a venue
export const getVenueMenus = async (req, res) => {
  try {
    const { venueId } = req.params;

    const menus = await Menu.find({ venue: venueId }).populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: menus.length,
      menus
    });
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menus',
      error: error.message
    });
  }
};

// Get single menu
export const getMenu = async (req, res) => {
  try {
    const { menuId } = req.params;

    const menu = await Menu.findById(menuId).populate('owner', 'name email');

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      menu
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu',
      error: error.message
    });
  }
};

// Update menu
export const updateMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name, description, items, isActive } = req.body;

    let menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check authorization
    if (menu.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu'
      });
    }

    // Update fields
    if (name) menu.name = name;
    if (description) menu.description = description;
    if (items) menu.items = items;
    if (isActive !== undefined) menu.isActive = isActive;
    menu.updatedAt = new Date();

    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      menu
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu',
      error: error.message
    });
  }
};

// Add menu item
export const addMenuItem = async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name, description, pricePerPlate, category, isVegetarian } = req.body;

    let menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check authorization
    if (menu.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this menu'
      });
    }

    const newItem = {
      name,
      description,
      pricePerPlate,
      category: category || 'main',
      isVegetarian: isVegetarian || false,
      isAvailable: true
    };

    menu.items.push(newItem);
    await menu.save();

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menu
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding menu item',
      error: error.message
    });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { menuId, itemId } = req.params;
    const { name, description, pricePerPlate, category, isVegetarian, isAvailable } = req.body;

    let menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check authorization
    if (menu.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this menu'
      });
    }

    // Find and update item
    const item = menu.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (name) item.name = name;
    if (description) item.description = description;
    if (pricePerPlate !== undefined) item.pricePerPlate = pricePerPlate;
    if (category) item.category = category;
    if (isVegetarian !== undefined) item.isVegetarian = isVegetarian;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      menu
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { menuId, itemId } = req.params;

    let menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check authorization
    if (menu.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this menu'
      });
    }

    // Remove item
    menu.items.id(itemId).remove();
    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      menu
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message
    });
  }
};

// Delete menu
export const deleteMenu = async (req, res) => {
  try {
    const { menuId } = req.params;

    const menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Check authorization
    if (menu.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu'
      });
    }

    await Menu.findByIdAndDelete(menuId);

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu',
      error: error.message
    });
  }
};
