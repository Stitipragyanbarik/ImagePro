import express from"express";
import jwt from"jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';


import User from '../models/Usermodel.js';

dotenv.config();




export const register =async(req,res)=>{
    const{email,password}=req.body;

    try{
        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).json({message:"User already exists"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser=new User({
            email,
            password:hashedPassword,
        });
        await newUser.save();
        res.status(201).json({message:"user registered successfully"});
    }
    catch(error){
        console.error(error);
        res.status(500).json({message:"server error"});
    }
};

export const login =async(req,res)=>{
    const {email,password}=req.body;
    try{
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const token=jwt.sign({email:user.email},process.env.JWT_SECRET || "default_secret",{expiresIn:"2d"});
        res.status(200).json({message:"Login successful",token});
    }
    catch(error){
        console.error(error);
        res.status(500).json({message:"server error"});
    }
};


