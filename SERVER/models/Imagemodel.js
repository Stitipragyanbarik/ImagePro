import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String },
    processingType: { type: String }, // 'compression', 'conversion', 'bg-removal'
    fileSize: { type: Number },
    format: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Image", imageSchema);
