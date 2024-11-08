import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const taxScehma = new Schema(
  {
    superAdminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
      require: false,
    },
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      require: false,
    },
    taxType: {
      type: String,
      require: true,
    },
    tax: {
      type: Number,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("tax", taxScehma);
