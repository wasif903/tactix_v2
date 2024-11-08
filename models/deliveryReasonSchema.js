import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const deliveryReasonSchema = new Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
    },
    assignedFromManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "managers",
      require: false,
    },
    riderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "riders",
      require: false,
    },
    reason: {
      type: String,
      require: true,
    }
  },
  {
    timestamps: true,
  }
);

export default model("reasons", deliveryReasonSchema);
