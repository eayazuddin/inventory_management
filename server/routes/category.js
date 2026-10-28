import express from "express";
import {
  addCategory,
  deleteCategory,
  getCategories,
  searchCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add",authMiddleware, addCategory);
router.get("/",authMiddleware, getCategories);
router.get("/search", authMiddleware, searchCategories);
router.patch("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);

export default router;