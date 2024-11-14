import express from "express";
import { CreateParcel, getParcelOfUser, HandleAssignParcels, HandleBulkParcelCreate, HandleBulkUpload, HandleGetParcels, HandleGetParcelsByGroupID, HandleGetSingleParcels, HandleTrackParcel } from "../controller/ParcelController.js";


const router = express.Router();

router.post("/create_parcel/:userId/:BranchId/:rateListID", CreateParcel);

router.get("/get-user-parcel/:userId", getParcelOfUser);

router.post("/bulk-parcel/:userId/:branchID", HandleBulkUpload);

router.post("/bulk-parcel-create/:userId/:branchID", HandleBulkParcelCreate);

router.post("/:branchID/:riderGroupID/assign-parcels", HandleAssignParcels);

router.get("/:id/get-parcels", HandleGetParcels);

router.get("/:parcelID/get-single-parcel", HandleGetSingleParcels);

router.post("/:userID/track-parcel/:trackID", HandleTrackParcel);

router.get("/get-parcels-rider-group/:riderGroupID", HandleGetParcelsByGroupID);


export default router;