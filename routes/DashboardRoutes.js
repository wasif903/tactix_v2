import express from "express";
import { HandleDashboardController } from "../controller/DashboardController.js";

const router = express.Router();

router.get("/dashboard/:id", HandleDashboardController)

export default router