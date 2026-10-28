import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const createOrder = async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Only customers can place orders",
    });
  }

  const { productId, quantity } = req.body;
  if (typeof productId !== "string" || !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "A valid product ID is required" });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a positive whole number",
    });
  }

  let product;
  try {
    product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    );
    if (!product) {
      const exists = await Product.exists({ _id: productId });
      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists ? "Not enough stock available for this quantity" : "Product not found",
      });
    }

    const order = await Order.create({
      customerId: req.user._id,
      productId: product._id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    if (product) {
      try {
        await Product.updateOne(
          { _id: product._id },
          { $inc: { stock: quantity } },
        );
      } catch (rollbackError) {
        console.error("Error restoring product stock after failed order", rollbackError);
      }
    }
    console.error("Error placing order", error);
    return res.status(500).json({ success: false, message: "Unable to place order" });
  }
};

const getOrders = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { customerId: req.user._id };
    const orders = await Order.find(query)
      .populate("customerId", "name email")
      .populate({
        path: "productId",
        select: "categoryId",
        populate: { path: "categoryId", select: "categoryName" },
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error getting orders", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "completed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be pending, completed, or cancelled",
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  let stockAdjustment = 0;
  let productId;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === status) {
      return res.status(200).json({ success: true, order });
    }

    productId = order.productId;
    if (order.status !== "cancelled" && status === "cancelled") {
      const productExists = await Product.exists({ _id: productId });
      if (productExists) {
        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: order.quantity } },
        );
        stockAdjustment = order.quantity;
      }
    } else if (order.status === "cancelled" && status !== "cancelled") {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: order.quantity } },
        { $inc: { stock: -order.quantity } },
        { new: true },
      );
      if (!product && await Product.exists({ _id: productId })) {
        return res.status(409).json({
          success: false,
          message: "Not enough stock available to restore this order",
        });
      }
      if (product) {
        stockAdjustment = -order.quantity;
      }
    }

    order.status = status;
    await order.save();
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    if (stockAdjustment && productId) {
      try {
        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: -stockAdjustment } },
        );
      } catch (rollbackError) {
        console.error("Error restoring product stock after failed status update", rollbackError);
      }
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    console.error("Error updating order status", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update order status",
    });
  }
};

export { createOrder, getOrders, updateOrderStatus };
