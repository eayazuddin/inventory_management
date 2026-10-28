import express from "express";
import {
  addUser,
  deleteUser,
  getUsers,
  searchUsers,
} from "../controllers/userController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.post("/add", addUser);
router.get("/", getUsers);
router.get("/search", searchUsers);
router.delete("/:id", deleteUser);

export default router;
