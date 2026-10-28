import bcrypt from "bcrypt";
import User from "./models/user.js";
import connectDB from "./db/connection.js";

const register = async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment");
    }

    await connectDB();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: "admin",
      email,
      password: hashedPassword,
      address: "admin address",
      role: "admin",
    });

    await newUser.save();
    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin user", error);
    process.exitCode = 1;
  }
};

register();