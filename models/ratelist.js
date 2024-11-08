import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const ratelist = new Schema({
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
    rateList: [{
        to: {
            type: String,
            required: true,
        },
        from: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        shipmentType: {
            type: [String],
            enum: ["Premium", "Express", "Economy", "Others"],
            default: ["Economy"]
        }
    }]
}, {
    timestamps: true,
}
);

export default model("ratelist", ratelist);
