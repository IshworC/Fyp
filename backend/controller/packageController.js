import mongoose from "mongoose";
import Package from "../models/Package.js";
import Venue from "../models/Venue.js";


// ==============================
// Create Package
// ==============================
export const createPackage = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Validate venueId
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID"
      });
    }

    const {
      name,
      description,
      type,
      basePrice,
      features,
      maxGuestCapacity,
      minGuestCapacity,
      includedMenus,
      addOns
    } = req.body;

    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found"
      });
    }

    // Check owner
    if (venue.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add package to this venue"
      });
    }

    const pkg = await Package.create({
      venue: venueId,
      owner: req.userId,
      name,
      description,
      type: type || "standard",
      basePrice,
      features: features || [],
      maxGuestCapacity,
      minGuestCapacity: minGuestCapacity || 1,
      includedMenus: includedMenus || [],
      addOns: addOns || {
        decoration: { enabled: false, price: 0 },
        soundSystem: { enabled: false, price: 0 },
        bartender: { enabled: false, price: 0 }
      }
    });

    const populatedPackage = await Package.findById(pkg._id)
      .populate("owner", "name email")
      .populate("includedMenus");

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: populatedPackage
    });

  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating package",
      error: error.message
    });
  }
};



// ==============================
// Get Packages for Venue
// ==============================
export const getVenuePackages = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Validate venueId
    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID"
      });
    }

    const packages = await Package.find({ venue: venueId })
      .populate("owner", "name email")
      .populate("includedMenus");

    res.status(200).json({
      success: true,
      count: packages.length,
      packages
    });

  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching packages",
      error: error.message
    });
  }
};



// ==============================
// Get Single Package
// ==============================
export const getPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID"
      });
    }

    const pkg = await Package.findById(packageId)
      .populate("owner", "name email")
      .populate("includedMenus");

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    res.status(200).json({
      success: true,
      package: pkg
    });

  } catch (error) {
    console.error("Get package error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching package",
      error: error.message
    });
  }
};



// ==============================
// Update Package
// ==============================
export const updatePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID"
      });
    }

    let pkg = await Package.findById(packageId);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    // Authorization check
    if (pkg.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this package"
      });
    }

    const {
      name,
      description,
      type,
      basePrice,
      features,
      maxGuestCapacity,
      minGuestCapacity,
      includedMenus,
      addOns,
      isActive
    } = req.body;

    if (name) pkg.name = name;
    if (description) pkg.description = description;
    if (type) pkg.type = type;
    if (basePrice !== undefined) pkg.basePrice = basePrice;
    if (features) pkg.features = features;
    if (maxGuestCapacity) pkg.maxGuestCapacity = maxGuestCapacity;
    if (minGuestCapacity) pkg.minGuestCapacity = minGuestCapacity;
    if (includedMenus) pkg.includedMenus = includedMenus;
    if (addOns) pkg.addOns = addOns;
    if (isActive !== undefined) pkg.isActive = isActive;

    pkg.updatedAt = new Date();

    await pkg.save();

    const updatedPackage = await Package.findById(packageId)
      .populate("owner", "name email")
      .populate("includedMenus");

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: updatedPackage
    });

  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating package",
      error: error.message
    });
  }
};



// ==============================
// Delete Package
// ==============================
export const deletePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID"
      });
    }

    const pkg = await Package.findById(packageId);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }
 if (pkg.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this package"
      });
    }

    await Package.findByIdAndDelete(packageId);

    res.status(200).json({
      success: true,
      message: "Package deleted successfully"
    });

  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting package",
      error: error.message
    });
  }
};