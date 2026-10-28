import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";

const addSupplier = async (req, res) => {
  try {
    const { name, email, number, address } = req.body;
    if (![name, email, number, address].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name, email, number, and address are required",
      });
    }

    const existingSupplier = await Supplier.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingSupplier) {
      return res.status(409).json({ success: false, message: "A supplier with this email already exists" });
    }

    const supplier = await Supplier.create({ name, email, number, address });
    return res.status(201).json({
      success: true,
      message: "Supplier added successfully",
      supplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "A supplier with this email already exists" });
    }
    console.error("Error adding supplier", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error("Error getting suppliers", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const searchSuppliers = async (req, res) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "A non-empty search query is required",
      });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const suppliers = await Supplier.find({
      $or: ["name", "email", "number", "address"].map((field) => ({
        [field]: { $regex: escapedQuery, $options: "i" },
      })),
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error("Error searching suppliers", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { name, email, number, address } = req.body;
    if (![name, email, number, address].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name, email, number, and address are required",
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingSupplier = await Supplier.findOne({
      email: normalizedEmail,
      _id: { $ne: supplier._id },
    });
    if (existingSupplier) {
      return res.status(409).json({ success: false, message: "A supplier with this email already exists" });
    }

    supplier.name = name.trim();
    supplier.email = normalizedEmail;
    supplier.number = number.trim();
    supplier.address = address.trim();
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "A supplier with this email already exists" });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid supplier ID" });
    }
    console.error("Error updating supplier", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    const linkedProducts = await Product.countDocuments({
      supplierId: supplier._id,
    });
    if (linkedProducts > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this supplier because ${linkedProducts} product${linkedProducts === 1 ? " is" : "s are"} using it. Reassign or delete those products first.`,
        linkedProducts,
      });
    }

    await supplier.deleteOne();
    return res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid supplier ID" });
    }
    console.error("Error deleting supplier", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addSupplier, deleteSupplier, getSuppliers, searchSuppliers, updateSupplier };
