import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const superAdmin = new Schema(
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
    phone: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps"
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: [String],
      required: true,
      enum: ["SuperAdmin"],
      default: ["SuperAdmin"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("superAdmin", superAdmin);
