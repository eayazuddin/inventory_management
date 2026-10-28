import express from "express";
import {
  addSupplier,
  deleteSupplier,
  getSuppliers,
  searchSuppliers,
  updateSupplier,
} from "../controllers/supplierController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/add", addSupplier);
router.get("/", getSuppliers);
router.get("/search", searchSuppliers);
router.patch("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
