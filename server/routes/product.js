import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addProduct,
  deleteProduct,
  getProducts,
  searchProducts,
  updateProduct,
} from "../controllers/productController.js";


const router = express.Router();

router.use(authMiddleware);
router.post("/add", addProduct);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
