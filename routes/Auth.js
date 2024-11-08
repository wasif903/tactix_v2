import express from "express";
import { createAdmin, CreateManagersbyAdmin, createRidersbyManager, CreateSupperAdmin, createUser, getallRidersofGroup, getSingleUser, getUserbyBranch, HandleCreateBulkRateList, HandleCreateBulkRateListUpdateUser, HandleGetAllAdmins, HandleUpdateRole, HandleUpdateUser, HandleUploadBulkRateList, Login } from "../controller/AuthController.js";


const router = express.Router();

router.post("/create_super_admin", CreateSupperAdmin);

router.post("/create_admin/:superAdminID", createAdmin);

router.get("/get-all-admins/:superAdminID", HandleGetAllAdmins)

router.post("/create_manager_by_admin/:adminID", CreateManagersbyAdmin);

router.post("/create_rider_by_manager/:managerID", createRidersbyManager);

router.post("/create_user/:BranchId/:managerID", createUser);

router.post("/update_user/:branchID/:managerID/:userID", HandleUpdateUser);

router.get("/get_branch_user/:branchId", getUserbyBranch);

router.get("/get_all_riders_from_group/:GroupID", getallRidersofGroup);

router.get("/get-single-user/:userId", getSingleUser);

router.post("/login", Login);

router.patch("/update-role/:id", HandleUpdateRole)


router.patch("/bulk-upload-ratelist/:rateListID", HandleUploadBulkRateList);

router.post("/bulk-create-ratelist/:branchID", HandleCreateBulkRateList);

router.post("/bulk-create-ratelist-user/:branchID", HandleCreateBulkRateListUpdateUser);

export default router;