import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const ratelist = new Schema(
  {
    managerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "managers",
      required: true,
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    rateList: [
      {
        countryName: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        zipCodeRangeStart: { type: String, required: true },
        zipCodeRangeEnd: { type: String, required: true },
        rates: { type: Number, required: true },
        weight: { type: Number, required: true },
        shipmentType: {
          type: [String],
          enum: ["SpeedyShip", "SteadyShip", "Postal Economy", "CustomShip"],
        },
        shipmentCategory: {
          type: [String],
          enum: ["Collection", "Mid-Mile", "Customs Clearance", "Delivery"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model("ratelist", ratelist);
