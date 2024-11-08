import express from "express";
import { HandleAcceptJob, HandleGetAssignmentsByBranch, HandleGetRiderJobs, HandleGetSingleJob, HandleTransferAssignment, HandleTransferReq, HandleUpdateAssignmentStatus, HandleUserCancelParcelID } from "../controller/AssigmentController.js";


const router = express.Router();


router.patch("/update-assignment-status/:assignmentID", HandleUpdateAssignmentStatus)

router.patch("/:userID/update-status-user/:parcelID", HandleUserCancelParcelID)

router.get("/get-assignments/:branchID", HandleGetAssignmentsByBranch)

router.patch("/transfer-assignments/:assignmentID/:newRiderID/:newriderGroupID/:assignedFromManager", HandleTransferAssignment)

router.patch("/transfer-request/:assignmentID", HandleTransferAssignment)

router.patch("/transfer-request-by-rider/:assignmentID", HandleTransferReq)

router.get("/get-rider-assignments/:riderID", HandleGetRiderJobs)

router.get("/get-single-job/:riderID/:assignmentID", HandleGetSingleJob)

router.patch("/accept-job/:assignmentID/:riderID", HandleAcceptJob)


export default router;