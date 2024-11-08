import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const countrySchema = new Schema(
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
    country: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default model("countries", countrySchema);
