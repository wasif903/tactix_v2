import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
import connectMongoDB from "./utils/ConnectDB.js";
// routes
import Auth from "./routes/Auth.js";
import Branch from "./routes/Branch.js";
import RidersGroup from "./routes/RidersGroup.js";
import Parcel from "./routes/Parcel.js";
import RateListRoutes from "./routes/RateListRoutes.js";
import AssignmentRoutes from "./routes/AssingmentRoutes.js";
import DashboardRoutes from "./routes/DashboardRoutes.js"

dotenv.config();
const app = express();



app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

connectMongoDB();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_Cloud,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.CLOUDINARY_API_KEY
})

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


// User Routes
app.use("/Auth", Auth)
app.use("/branch", Branch)
app.use("/riders_group", RidersGroup)
app.use("/parcel", Parcel)
app.use("/assignments", AssignmentRoutes)
app.use("/ratelist", RateListRoutes)

// Dashboard Route For All Users
app.use("/api", DashboardRoutes)

app.get("/", (req, res) => {
  try {
    res.send("Node WORKING, Welcome");
  } catch (error) {
    console.log(error);
  }
})

app.listen(PORT, () => {
  console.log(`App Running... ${process.env.PORT}`);
});