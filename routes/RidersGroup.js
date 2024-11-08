import express from "express";
import { CreateRiderGroup, GetRidersGroup, GetRidersGroupForAdmin, getRiderGroupforSuperAdmin, getRidersGroupByBranchID } from "../controller/RidersGroupController.js";


const router = express.Router();



router.post("/create_riders_group/:BranchManagerID/:BranchID", CreateRiderGroup);

router.get("/get_riders_group/:BranchManagerID", GetRidersGroup);

router.get("/get_riders_group_by_branch/:BranchID", getRidersGroupByBranchID);

router.get("/GetRidersGroupForAdmin/:AdminId", GetRidersGroupForAdmin);

router.get("/GetRidersGroupForSuperAdmin/:superAdminID", getRiderGroupforSuperAdmin);


export default router;