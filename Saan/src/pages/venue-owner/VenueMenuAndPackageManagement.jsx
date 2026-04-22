import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menuAPI, packageAPI } from '../../services/api';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSave, FaTimes, FaCheck } from 'react-icons/fa';

function VenueMenuAndPackageManagement() {
  const navigate = useNavigate();
  const { venueId: routeVenueId } = useParams();
  const token = localStorage.getItem('token');
  const [currentVenueId, setCurrentVenueId] = useState(routeVenueId);

  // Tabs: menus, packages
  const [activeTab, setActiveTab] = useState('menus');

  // MENUS STATE
  const [menus, setMenus] = useState([]);
  const [showNewMenuForm, setShowNewMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [newMenuData, setNewMenuData] = useState({
    name: '',
    description: ''
  });

  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    pricePerPlate: '',
    category: 'main',
    isVegetarian: false
  });

  // PACKAGES STATE
  const [packages, setPackages] = useState([]);
  const [showNewPackageForm, setShowNewPackageForm] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);

  const [newPackageData, setNewPackageData] = useState({
    name: '',
    description: '',
    type: 'standard',
    basePrice: '',
    features: [],
    minGuestCapacity: '',
    maxGuestCapacity: '',
    includedMenus: [],
    addOns: {
      decoration: { enabled: false, price: 0 },
      soundSystem: { enabled: false, price: 0 },
      bartender: { enabled: false, price: 0 }
    }
  });

  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const packageTypes = ['basic', 'standard', 'premium', 'custom'];

  // Fetch data
  useEffect(() => {
    const initializeVenueId = async () => {
      let id = routeVenueId;

      if (!id) {
        try {
          const registrationResponse = await venueRegistrationAPI.getMyRegistration(token);
          id = registrationResponse?.registration?.venue?._id || registrationResponse?.registration?.venue || null;
        } catch (error) {
          console.error('Unable to get venue from registration:', error);
        }
      }

      if (!id) {
        try {
          const venuesResponse = await venueAPI.getMyVenues(token);
          if (venuesResponse.success && venuesResponse.venues?.length > 0) {
            id = venuesResponse.venues[0]._id;
          }
        } catch (error) {
          console.error('Unable to retrieve owner venues:', error);
        }
      }

      if (!id) {
        setError('Venue ID not found. Please ensure your venue is approved by admin.');
        setLoading(false);
        return;
      }

      setCurrentVenueId(id);
    };

    initializeVenueId();
  }, [routeVenueId, token]);

  useEffect(() => {
    if (currentVenueId) {
      fetchData();
    }
  }, [currentVenueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menusResponse, packagesResponse] = await Promise.all([
        menuAPI.getVenueMenus(currentVenueId),
        packageAPI.getVenuePackages(currentVenueId)
      ]);

      if (menusResponse.success) {
        setMenus(menusResponse.menus || []);
      }
      if (packagesResponse.success) {
        setPackages(packagesResponse.packages || []);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ========== MENU FUNCTIONS ==========

  const handleCreateMenu = async () => {
    if (!newMenuData.name.trim()) {
      setError('Menu name is required');
      return;
    }

    try {
      setError('');
      const response = await menuAPI.createMenu(token, currentVenueId, newMenuData);
      if (response.success) {
        setSuccess('Menu created successfully!');
        setNewMenuData({ name: '', description: '' });
        setShowNewMenuForm(false);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to create menu');
      console.error(err);
    }
  };

  const handleAddMenuItem = async (menuId) => {
    if (!newItemData.name.trim() || !newItemData.pricePerPlate) {
      setError('Item name and price are required');
      return;
    }

    try {
      setError('');
      const response = await menuAPI.addMenuItem(token, menuId, newItemData);
      if (response.success) {
        setSuccess('Menu item added successfully!');
        setNewItemData({
          name: '',
          description: '',
          pricePerPlate: '',
          category: 'main',
          isVegetarian: false
        });
        setEditingMenuId(null);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to add menu item');
      console.error(err);
    }
  };

  const handleDeleteMenuItem = async (menuId, itemId) => {
    if (window.confirm('Delete this menu item?')) {
      try {
        setError('');
        const response = await menuAPI.deleteMenuItem(token, menuId, itemId);
        if (response.success) {
          setSuccess('Menu item deleted!');
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('Failed to delete menu item');
        console.error(err);
      }
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (window.confirm('Delete this entire menu and all its items?')) {
      try {
        setError('');
        const response = await menuAPI.deleteMenu(token, menuId);
        if (response.success) {
          setSuccess('Menu deleted!');
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('Failed to delete menu');
        console.error(err);
      }
    }
  };

  // ========== PACKAGE FUNCTIONS ==========

  const handleCreatePackage = async () => {
    if (!newPackageData.name.trim() || !newPackageData.basePrice) {
      setError('Package name and price are required');
      return;
    }

    if (!newPackageData.maxGuestCapacity) {
      setError('Max guest capacity is required');
      return;
    }

    if (!token) {
      setError('No authentication token. Please login again.');
      return;
    }

    if (!currentVenueId) {
      setError('Venue ID not found. Please refresh and try again.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const payload = {
        name: newPackageData.name,
        description: newPackageData.description,
        type: newPackageData.type || 'standard',
        basePrice: parseFloat(newPackageData.basePrice),
        minGuestCapacity: parseInt(newPackageData.minGuestCapacity) || 1,
        maxGuestCapacity: parseInt(newPackageData.maxGuestCapacity),
        features: newPackageData.features,
        includedMenus: newPackageData.includedMenus,
        addOns: {
          decoration: { 
            enabled: newPackageData.addOns.decoration.enabled, 
            price: parseFloat(newPackageData.addOns.decoration.price) || 0 
          },
          soundSystem: { 
            enabled: newPackageData.addOns.soundSystem.enabled, 
            price: parseFloat(newPackageData.addOns.soundSystem.price) || 0 
          },
          bartender: { 
            enabled: newPackageData.addOns.bartender.enabled, 
            price: parseFloat(newPackageData.addOns.bartender.price) || 0 
          }
        }
      };

      console.log('Creating package with payload:', payload);
      
      const response = await packageAPI.createPackage(token, currentVenueId, payload);
      console.log('Package creation response:', response);
      
      if (response.success) {
        setSuccess('Package created successfully!');
        setNewPackageData({
          name: '',
          description: '',
          type: 'standard',
          basePrice: '',
          features: [],
          minGuestCapacity: '',
          maxGuestCapacity: '',
          includedMenus: [],
          addOns: {
            decoration: { enabled: false, price: 0 },
            soundSystem: { enabled: false, price: 0 },
            bartender: { enabled: false, price: 0 }
          }
        });
        setNewFeature('');
        setShowNewPackageForm(false);
        await fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to create package');
        console.error('Package creation failed:', response);
      }
    } catch (err) {
      console.error('Package creation error:', err);
      setError(err.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewPackageData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setNewPackageData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleToggleMenu = (menuId) => {
    setNewPackageData(prev => {
      const menuIds = prev.includedMenus.includes(menuId)
        ? prev.includedMenus.filter(id => id !== menuId)
        : [...prev.includedMenus, menuId];
      return { ...prev, includedMenus: menuIds };
    });
  };

  const handleDeletePackage = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        setError('');
        const response = await packageAPI.deletePackage(token, packageId);
        if (response.success) {
          setSuccess('Package deleted!');
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('Failed to delete package');
        console.error(err);
      }
    }
  };

  const handleAddOnChange = (addOnType, field, value) => {
    setNewPackageData(prev => ({
      ...prev,
      addOns: {
        ...prev.addOns,
        [addOnType]: {
          ...prev.addOns[addOnType],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/venue-owner/dashboard')}
            className="flex items-center gap-2 text-purple-800 hover:text-purple-900 transition"
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex-1">Menu & Package Management</h1>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('menus')}
              className={`flex-1 px-6 py-4 font-semibold border-b-2 transition ${
                activeTab === 'menus'
                  ? 'border-purple-800 text-purple-800'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🍽️ Menus ({menus.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`flex-1 px-6 py-4 font-semibold border-b-2 transition ${
                activeTab === 'packages'
                  ? 'border-purple-800 text-purple-800'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Packages ({packages.length})
            </button>
          </div>
        </div>

        {/* ===== MENUS TAB ===== */}
        {activeTab === 'menus' && (
          <div className="space-y-6">
            {/* Create Menu Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewMenuForm(!showNewMenuForm)}
                className="flex items-center gap-2 bg-purple-800 text-white px-6 py-3 rounded-lg hover:bg-purple-900 transition font-semibold"
              >
                <FaPlus /> Create Menu
              </button>
            </div>

            {/* Create Menu Form */}
            {showNewMenuForm && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Create New Menu</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., North Indian, Chinese, Desserts"
                    value={newMenuData.name}
                    onChange={(e) => setNewMenuData({ ...newMenuData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe this menu..."
                    value={newMenuData.description}
                    onChange={(e) => setNewMenuData({ ...newMenuData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800 h-20"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowNewMenuForm(false)}
                    className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FaTimes className="inline mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleCreateMenu}
                    className="px-6 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition flex items-center gap-2"
                  >
                    <FaSave /> Create Menu
                  </button>
                </div>
              </div>
            )}

            {/* Menus List */}
            {menus.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 text-lg">No menus created yet. Create your first menu!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {menus.map(menu => (
                  <div key={menu._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 p-6 border-b flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{menu.name}</h3>
                        {menu.description && <p className="text-gray-600 mt-1">{menu.description}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteMenu(menu._id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-6">
                      {menu.items && menu.items.length > 0 ? (
                        <div className="space-y-4 mb-6">
                          {menu.items.map(item => (
                            <div key={item._id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start hover:shadow transition">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  {item.isVegetarian && <span className="text-green-600 text-sm">🌱 Veg</span>}
                                </div>
                                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                <div className="mt-2 flex gap-4 text-sm">
                                  <span className="text-purple-800 font-bold">₹{item.pricePerPlate}/plate</span>
                                  <span className="text-gray-600 capitalize">{item.category}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteMenuItem(menu._id, item._id)}
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition ml-4"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 mb-6">No items in this menu yet.</p>
                      )}

                      {/* Add Item Form */}
                      {editingMenuId === menu._id ? (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3 border-2 border-blue-200">
                          <h4 className="font-semibold text-gray-900">Add New Item</h4>

                          <input
                            type="text"
                            placeholder="Item name"
                            value={newItemData.name}
                            onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                          />

                          <textarea
                            placeholder="Item description (optional)"
                            value={newItemData.description}
                            onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800 h-16"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              placeholder="Price per plate"
                              value={newItemData.pricePerPlate}
                              onChange={(e) => setNewItemData({ ...newItemData, pricePerPlate: e.target.value })}
                              className="px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                            />

                            <select
                              value={newItemData.category}
                              onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                              className="px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                            >
                              <option value="main">Main Course</option>
                              <option value="starter">Starter</option>
                              <option value="dessert">Dessert</option>
                              <option value="beverage">Beverage</option>
                            </select>
                          </div>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newItemData.isVegetarian}
                              onChange={(e) => setNewItemData({ ...newItemData, isVegetarian: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-gray-700">Vegetarian</span>
                          </label>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleAddMenuItem(menu._id)}
                              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                            >
                              <FaCheck /> Add Item
                            </button>
                            <button
                              onClick={() => setEditingMenuId(null)}
                              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingMenuId(menu._id)}
                          className="w-full border-2 border-dashed border-gray-300 py-3 rounded-lg text-gray-600 hover:border-purple-800 hover:text-purple-800 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <FaPlus /> Add Item to This Menu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PACKAGES TAB ===== */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            {/* Create Package Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewPackageForm(!showNewPackageForm)}
                className="flex items-center gap-2 bg-purple-800 text-white px-6 py-3 rounded-lg hover:bg-purple-900 transition font-semibold"
              >
                <FaPlus /> Create Package
              </button>
            </div>

            {/* Create Package Form */}
            {showNewPackageForm && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Create New Package</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Wedding Gold Package"
                      value={newPackageData.name}
                      onChange={(e) => setNewPackageData({ ...newPackageData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
                    <select
                      value={newPackageData.type}
                      onChange={(e) => setNewPackageData({ ...newPackageData, type: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    >
                      {packageTypes.map(type => (
                        <option key={type} value={type} className="capitalize">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe this package..."
                    value={newPackageData.description}
                    onChange={(e) => setNewPackageData({ ...newPackageData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800 h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Price *</label>
                    <input
                      type="number"
                      placeholder="₹0"
                      value={newPackageData.basePrice}
                      onChange={(e) => setNewPackageData({ ...newPackageData, basePrice: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Capacity</label>
                    <input
                      type="number"
                      placeholder="e.g., 50"
                      value={newPackageData.minGuestCapacity}
                      onChange={(e) => setNewPackageData({ ...newPackageData, minGuestCapacity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity *</label>
                    <input
                      type="number"
                      placeholder="e.g., 500"
                      value={newPackageData.maxGuestCapacity}
                      onChange={(e) => setNewPackageData({ ...newPackageData, maxGuestCapacity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Package Features</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g., Veg & Non-Veg, Premium Decor"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-800"
                    />
                    <button
                      onClick={handleAddFeature}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {newPackageData.features.length > 0 && (
                    <div className="space-y-2">
                      {newPackageData.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                          <span className="text-gray-700">{feature}</span>
                          <button
                            onClick={() => handleRemoveFeature(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Menus */}
                {menus.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Link Menus (Optional)</label>
                    <div className="space-y-2">
                      {menus.map(menu => (
                        <label key={menu._id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newPackageData.includedMenus.includes(menu._id)}
                            onChange={() => handleToggleMenu(menu._id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-gray-700">{menu.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-Ons */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Additional Services</label>
                  <div className="space-y-4">
                    {/* Decoration */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={newPackageData.addOns.decoration.enabled}
                          onChange={(e) => handleAddOnChange('decoration', 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="font-semibold text-gray-700">🎨 Decoration Service</span>
                      </label>
                      {newPackageData.addOns.decoration.enabled && (
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={newPackageData.addOns.decoration.price}
                          onChange={(e) => handleAddOnChange('decoration', 'price', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                        />
                      )}
                    </div>

                    {/* Sound System */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={newPackageData.addOns.soundSystem.enabled}
                          onChange={(e) => handleAddOnChange('soundSystem', 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="font-semibold text-gray-700">🔊 Sound System</span>
                      </label>
                      {newPackageData.addOns.soundSystem.enabled && (
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={newPackageData.addOns.soundSystem.price}
                          onChange={(e) => handleAddOnChange('soundSystem', 'price', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                        />
                      )}
                    </div>

                    {/* Bartender */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={newPackageData.addOns.bartender.enabled}
                          onChange={(e) => handleAddOnChange('bartender', 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="font-semibold text-gray-700">🍸 Bartender Service</span>
                      </label>
                      {newPackageData.addOns.bartender.enabled && (
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={newPackageData.addOns.bartender.price}
                          onChange={(e) => handleAddOnChange('bartender', 'price', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-800"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    onClick={() => setShowNewPackageForm(false)}
                    className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    <FaTimes className="inline mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleCreatePackage}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                      loading 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-purple-800 text-white hover:bg-purple-900'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaSave /> Create Package
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Packages List */}
            {packages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 text-lg">No packages created yet. Create your first package!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map(pkg => (
                  <div key={pkg._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border-2 border-gray-200">
                    <div className="bg-gradient-to-r from-purple-800 to-[#8b1515] h-20 flex items-center justify-between px-6">
                      <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                      <button
                        onClick={() => handleDeletePackage(pkg._id)}
                        className="text-white hover:bg-red-700 p-2 rounded-lg transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      {pkg.description && <p className="text-gray-600">{pkg.description}</p>}

                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-purple-800">₹{pkg.basePrice}</span>
                        <span className="bg-purple-800 text-white px-3 py-1 rounded-full text-xs capitalize font-semibold">
                          {pkg.type}
                        </span>
                      </div>

                      {(pkg.minCapacity || pkg.maxCapacity) && (
                        <p className="text-sm text-gray-600">
                          👥 Capacity: {pkg.minCapacity} - {pkg.maxCapacity} guests
                        </p>
                      )}

                      {pkg.features && pkg.features.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Features:</p>
                          <ul className="space-y-1">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="text-purple-800">✓</span> {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pkg.addOns && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Add-ons Available:</p>
                          <div className="space-y-1">
                            {pkg.addOns.decoration.enabled && (
                              <p className="text-sm text-gray-600">🎨 Decoration: ₹{pkg.addOns.decoration.price}</p>
                            )}
                            {pkg.addOns.soundSystem.enabled && (
                              <p className="text-sm text-gray-600">🔊 Sound System: ₹{pkg.addOns.soundSystem.price}</p>
                            )}
                            {pkg.addOns.bartender.enabled && (
                              <p className="text-sm text-gray-600">🍸 Bartender: ₹{pkg.addOns.bartender.price}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueMenuAndPackageManagement;
