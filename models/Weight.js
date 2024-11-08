import mongoose, { model, mongo } from "mongoose";
const { Schema } = mongoose;

const weightSchema = new Schema(
  {
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      require: false,
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
    },
    perKg: {
      type: Number,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("weight", weightSchema);
