import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.js";

const validRoles = ["admin", "customer"];
const userFields = "name email address role";

const addUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;
    if (
      ![name, email, password, address].every(
        (value) => typeof value === "string" && value.trim(),
      ) ||
      typeof role !== "string" ||
      !validRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, address, and a valid role are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      address: address.trim(),
      role,
    });

    return res.status(201).json({
      success: true,
      message: "User added successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }
    console.error("Error adding user", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select(userFields).sort({ name: 1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error getting users", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "A non-empty search query is required",
      });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const roleQuery =
      query.toLowerCase() === "user" ? "customer" : escapedQuery;
    const users = await User.find({
      $or: ["name", "email", "address"].map((field) => ({
        [field]: { $regex: escapedQuery, $options: "i" },
      })).concat({ role: { $regex: roleQuery, $options: "i" } }),
    })
      .select(userFields)
      .sort({ name: 1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error searching users", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "The last admin account cannot be deleted",
        });
      }
    }

    await user.deleteOne();
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addUser, getUsers, searchUsers, deleteUser };
