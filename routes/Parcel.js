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





// missingFields: {
//     parcelDescription: !rowData.parcelDescription
//       ? "parcelDescription field is required"
//       : null,
//     CodAmount: !rowData.CodAmount
//       ? "CodAmount field is required"
//       : null,
//     codValidation:
//       rowData.CodAmount === "yes" &&
//       (!rowData.CodCharges !== "null" || rowData.CodCharges !== "0")
//         ? "CodCharges cannot be null or 0 if CodAmount is 'yes'"
//         : null,
//     weight: !rowData.weight ? "weight field is required" : null,
//     length: !rowData.length ? "length field is required" : null,
//     recieverPhone: !rowData.recieverPhone
//       ? "recieverPhone field is required"
//       : null,
//     receiverName: !rowData.receiverName
//       ? "receiverName field is required"
//       : null,
//     reciverAddress: !rowData.reciverAddress
//       ? "reciverAddress field is required"
//       : null,
//     ReciverPostCode: !rowData.ReciverPostCode
//       ? "ReciverPostCode field is required"
//       : null,
//     SenderPhone: !rowData.SenderPhone
//       ? "SenderPhone field is required"
//       : null,
//     SenderAddress: !rowData.SenderAddress
//       ? "SenderAddress field is required"
//       : null,
//     SenderPostCode: !rowData.SenderPostCode
//       ? "SenderPostCode field is required"
//       : null,
//     haveOwnTrackID: Boolean(
//       rowData.haveOwnTrackID === "yes" ? true : false
//     ),
//     ownTrackID:
//       rowData.haveOwnTrackID === "yes" &&
//       (rowData.ownTrackID !== "null" ||
//         rowData.ownTrackID.length !== 14)
//         ? "ownTrackID cannot be null or less than 14 digits"
//         : null,
//     CodCharges: !rowData.CodCharges
//       ? "CodCharges field is required"
//       : null,
//     hsCode:
//       rowData.hsCode && rowData.hsCode.length !== 7
//         ? "hsCode should be 7 digits long"
//         : null,
//     dangerousGoods:
//       !rowData.dangerousGoods ||
//       (rowData.dangerousGoods !== "yes" &&
//         rowData.dangerousGoods !== "no")
//         ? 'dangerousGoods must be "yes" or "no"'
//         : null,
//   },