import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const getProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            address: req.user.address || "",
            role: req.user.role,
        },
    });
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, address, password } = req.body;
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof address !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and address are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }
        if (password !== undefined && password !== "" &&
            (typeof password !== "string" || password.length < 8)) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user._id },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists",
            });
        }

        req.user.name = name.trim();
        req.user.email = normalizedEmail;
        req.user.address = address.trim();
        if (password) {
            req.user.password = await bcrypt.hash(password, 10);
        }
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                address: req.user.address || "",
                role: req.user.role,
            },
        });
    } catch (error) {
        console.error("Error updating profile", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update profile",
        });
    }
};

const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({success: false,message: "user not found"});
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({success:false, message: "Invalid credentials"});
        }
        const token = jwt.sign({id: user._id,role:user.role}, process.env.JWT_SECRET,{expiresIn: '2d'});

        return res.status(200).json({success: true,message: "Login successful",token,user:({id:user._id,name:user.name,email:user.email,role: user.role})});

    } 

    catch(error){
        return res.status(500).json({success: false, message:"Internal server error"});
    }
}

export {getProfile, login, updateProfile};