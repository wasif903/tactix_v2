import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const citySchema = new Schema(
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
    countryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "countries",
    },
    stateID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "states",
    },
    city: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default model("cities", citySchema);
