import mongoose, { Mongoose, model } from "mongoose";
const { Schema } = mongoose;

const BranchSchema = new Schema(
  {
    superAdminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
      required: true,
    },
    branch_name: {
      type: String,
      required: true,
    },
    branch_address: {
      type: String,
      required: true,
    },
    branch_contact_number: {
      type: Number,
      required: true,
    },
    AdminsId: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

export default model("branches", BranchSchema);
