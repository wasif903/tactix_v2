import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const parcelSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    rateListID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ratelist",
      required: true,
    },
    parcelName: {
      type: String,
      required: true,
    },

    haveOwnTrackID: {
      type: Boolean,
      required: false,
    },
    ownTrackID: {
      type: String,
      default: "",
    },

    CodAmount: {
      type: Boolean,
      default: false,
    },
    CodCharges: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      required: true,
    },
    hsCode: {
      type: String,
    },
    dangerousGoods: {
      type: Boolean,
      default: false,
    },
    status: {
      type: [String],
      requiredd: true,
      enum: ["pending", "Order Received", "cancelled", "completed", "returned"],
      default: ["pending"],
    },

    Dimension: {
      height: {
        type: Number,
      },
      width: {
        type: Number,
      },
      length: {
        type: Number,
      },
    },
    
    receiverName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    recieverPhone: {
      type: Number,
      required: true,
    },
    recieverEmail: {
      type: String,
    },
    reciverAddress: {
      type: String,
      required: true,
    },
    ReciverPostCode: {
      type: Number,
      required: true,
    },
    SenderPhone: {
      type: Number,
      required: true,
    },
    SenderAddress: {
      type: String,
      required: true,
    },
    SenderPostCode: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("parcel", parcelSchema);
