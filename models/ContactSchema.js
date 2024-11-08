import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const citySchema = new Schema(
    {
        name: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export default model("cities", citySchema);
