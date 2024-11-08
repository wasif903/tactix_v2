

import mongoose, { Mongoose, model } from "mongoose";
const { Schema } = mongoose;

const RidersGroupSchema = new Schema(
  {
    BranchManagerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "managers",
      required: true,
    },
    BranchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    groupname: {
        type: String,
        required: true,
      },
  },
  {
    timestamps: true,
  }
);

export default model("ridersgroup", RidersGroupSchema);
