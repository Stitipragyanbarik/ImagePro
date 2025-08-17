import express from 'express';
import bcrypt from 'bcrypt';
import { authenticate } from "../middlewares/authMiddleware.js";
import { register, login } from '../controllers/authController.js';
import User from '../models/Usermodel.js';

const router = express.Router();



// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

router.get("/profile",authenticate,(req,res)=>{
    res.status(200).json({message:"Access granted to user profile",user:req.user});
});



export default router;
