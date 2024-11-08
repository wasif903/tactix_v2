import mongoose, { Mongoose, model } from "mongoose";
const { Schema } = mongoose;

const AdminSchema = new Schema(
  {
    superAdminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
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
      unique: false
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
      enum: ["Admin"],
      default: ["Admin"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("admins", AdminSchema);
