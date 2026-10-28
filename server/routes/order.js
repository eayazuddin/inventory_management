import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", getOrders);
router.post("/", createOrder);
router.patch("/:id/status", adminMiddleware, updateOrderStatus);

export default router;
