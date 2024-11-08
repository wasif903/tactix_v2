import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const userAuth = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    BranchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps"
    },
    status: {
      type: [String],
      required: true,
      enum: ["Active", "Blocked"],
      default: ["Active"],
    },
    role: {
      type: [String],
      required: true,
      enum: ["User"],
      default: ["User"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("users", userAuth);
