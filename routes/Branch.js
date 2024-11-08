import express from "express";
import { AsignBranchToAdmin, createBranch, getAdminBranches, getAllBranchesforSupperAdmin, GetManagersbybranch, getSingleBranch, HandleUpdateBranch } from "../controller/BranchController.js";



const router = express.Router();



router.post("/create_branch/:superAdminID", createBranch);

router.get("/get_all_branches_for_Superadmin/:superAdminID", getAllBranchesforSupperAdmin);

router.patch("/asign_branches_to_admin/:SuperAdminId/:branchId", AsignBranchToAdmin);


router.get("/get_admin_branches/:AdminId", getAdminBranches);

router.get("/get_single_branch/:branchID", getSingleBranch);


router.get("/get_branch_managers/:adminID", GetManagersbybranch);

router.patch("/edit-branch/:id", HandleUpdateBranch);




export default router;