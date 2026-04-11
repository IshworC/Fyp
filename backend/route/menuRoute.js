import express from 'express';
import {
  createMenu,
  getVenueMenus,
  getMenu,
  updateMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  deleteMenu
} from '../controller/menuController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes - users can view menus
router.get('/venue/:venueId', getVenueMenus);
router.get('/:menuId', getMenu);

// Protected routes - venue owners only
router.post('/venue/:venueId', authenticate, authorize(['venue-owner']), createMenu);
router.put('/:menuId', authenticate, authorize(['venue-owner']), updateMenu);
router.delete('/:menuId', authenticate, authorize(['venue-owner']), deleteMenu);

// Menu items
router.post('/:menuId/items', authenticate, authorize(['venue-owner']), addMenuItem);
router.put('/:menuId/items/:itemId', authenticate, authorize(['venue-owner']), updateMenuItem);
router.delete('/:menuId/items/:itemId', authenticate, authorize(['venue-owner']), deleteMenuItem);

export default router;
