import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";

const getProductValues = async (body) => {
  const { name, description, price, stock, categoryId, supplierId } = body;
  const parsedPrice = Number(price);
  const parsedStock = Number(stock);
  const hasPrice = (typeof price === "number" || typeof price === "string") &&
    String(price).trim() !== "";
  const hasStock = (typeof stock === "number" || typeof stock === "string") &&
    String(stock).trim() !== "";

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !hasPrice ||
    !Number.isFinite(parsedPrice) ||
    parsedPrice < 0 ||
    !hasStock ||
    !Number.isInteger(parsedStock) ||
    parsedStock < 0 ||
    typeof categoryId !== "string" ||
    typeof supplierId !== "string"
  ) {
    return {
      error: "Name, description, valid price and stock, category, and supplier are required",
    };
  }

  const [foundCategory, foundSupplier] = await Promise.all([
    Category.findById(categoryId),
    Supplier.findById(supplierId),
  ]);
  if (!foundCategory || !foundSupplier) {
    return { error: "Select an existing category and supplier" };
  }

  return {
    values: {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      stock: parsedStock,
      categoryId: foundCategory._id,
      supplierId: foundSupplier._id,
    },
  };
};

const addProduct = async (req, res) => {
  try {
    const result = await getProductValues(req.body);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const product = await Product.create(result.values);
    await product.populate(["categoryId", "supplierId"]);
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid category or supplier" });
    }
    console.error("Error adding product", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categoryId", "categoryName")
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error getting products", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const searchProducts = async (req, res) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "A non-empty search query is required",
      });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const products = await Product.find({
      name: { $regex: escapedQuery, $options: "i" },
    })
      .populate("categoryId", "categoryName")
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error searching products", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const result = await getProductValues(req.body);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    Object.assign(product, result.values);
    await product.save();
    await product.populate(["categoryId", "supplierId"]);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product, category, or supplier ID" });
    }
    console.error("Error updating product", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    console.error("Error deleting product", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addProduct, deleteProduct, getProducts, searchProducts, updateProduct };
