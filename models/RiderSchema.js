import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const RiderSchema = new Schema(
  {
    managerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      required: true,
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    RiderGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ridersgroup",
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
      default: "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps"
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
      enum: ["Rider"],
      default: ["Rider"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("riders", RiderSchema);
