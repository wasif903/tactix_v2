import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Assignment = new Schema(
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
    riderGroupID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ridergroups",
      require: false,
    },
    riderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "riders",
      default: null
    },
    customerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      require: false,
    },
    parcelID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "parcel",
      require: false,
    },
    totalPrice: {
      type: Number,
    },
    transferredFromRiders: {
      type: [
        {
          riderID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "riders",
          },
          reason: {
            type: String,
          }
        }
      ],
      default: []
    },

    Status: {
      type: [String],
      enum: ["Order Assigned",
        "Transfer",
        "Shipment Collected",
        "In Transit to Origin Facility",
        "Customs/Terminal Clearance in Origin Country",
        "Departed from Origin Country",
        "In Transit to Destination Country",
        "Arrived at Destination Country",
        "Customs/Terminal Clearance in Destination Country",
        "Shipment Sorted at Delivery Facility",
        "Out for Delivery",
        "Delivered",
        "Undelivered",
        "Return to Sender"],
      default: ["Order Assigned"],
    },

    reason: {
      type: String,
      default: ""
    },

    completionPicture: {
      type: String,
      default: ""
    },

    deliveryStartTime: {
      type: String,
      default: ""
    },

    deliveryEndTime: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

export default model("assignments", Assignment);
