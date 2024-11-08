import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const stateSchema = new Schema(
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
    state: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default model("states", stateSchema);
