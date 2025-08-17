import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
  },
},{ timestamps: true });

// Prevent model overwrite error
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
