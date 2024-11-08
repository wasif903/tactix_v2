import mongoose, { Mongoose, model } from "mongoose";
const { Schema } = mongoose;

const ManagerSchema = new Schema(
  {
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      required: true,
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    profileImage: {
        type: String,
      default:"https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps"
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
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
      enum: ["Manager"],
      default: ["Manager"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("managers", ManagerSchema);
