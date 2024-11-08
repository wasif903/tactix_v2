import Assignment from "../models/Assignment.js";
import BranchSchema from "../models/BranchSchema.js";
import parcelSchema from "../models/parcelSchema.js";
import RiderSchema from "../models/RiderSchema.js";
import { v2 as cloudinary } from "cloudinary";
import RidersGroupSchema from "../models/RidersGroupSchema.js";
import UserSchema from "../models/UserSchema.js";
import ratelist from "../models/ratelist.js";
import SuperAdmin from "../models/SuperAdmin.js";


const HandleGetAssignmentsByBranch = async (req, res) => {
    try {
        const { branchID } = req.params;
        const findBranch = await BranchSchema.findById(branchID);
        if (!findBranch) {
            return res.status(404).json({ message: "Branch Not Found" });
        }
        const assignments = await Assignment.find({ branchID }).populate({
            path: "branchID",
            model: "branches",
        }).populate({
            path: "assignedFromManager",
            model: "managers",
        }).populate({
            path: "riderGroupID",
            model: "ridersgroup",
        }).populate({
            path: "customerID",
            model: "users",
        }).populate({
            path: "riderID",
            model: "riders",
        }).populate({
            path: "parcelID",
            model: "parcel",
        });
        res.status(200).json({ assignments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleUpdateAssignmentStatus = async (req, res) => {
    try {

        const {
            assignmentID,
        } = req.params;

        const {
            reason,
            groupID
        } = req.body;

        let status = req.body.status;

        const findAssignment = await Assignment.findById(assignmentID);

        const findParcel = await parcelSchema.findById(findAssignment.parcelID);

        const completionPicture = req?.files?.completionPicture;
        const uploadResult = completionPicture ? await cloudinary.uploader.upload(completionPicture.tempFilePath, {
            resource_type: 'image',
            folder: "completion-picture",
        }) : '';

        if (!findAssignment) {
            return res.status(404).json({ message: "Assignment Not Found" });
        }
        if (!findParcel) {
            return res.status(404).json({ message: "Assignment Not Found" });
        }

        if (!Array.isArray(status)) {
            if (typeof status === 'string') {
                status = [status];
            } else {
                return res.status(404).json({ message: "Status format is not valid" });
            }
        }

        if (status.includes("Order Assigned")) {

            const findGroupId = await RidersGroupSchema.findById(groupID);
            if (!findGroupId) {
                return res.status(404).json({ message: "Invalid Driver Crew" })
            }
            findAssignment.transferredFromRiders = [...findAssignment.transferredFromRiders, findAssignment.riderID];
            findAssignment.riderID = null;
            findAssignment.riderGroupID = groupID;
            findAssignment.Status = ["Order Assigned"]
            findParcel.status = ["Order Received"];
            findAssignment.reason = reason;
            await findAssignment.save();
            await findParcel.save();

        }

        if (status.includes("Shipment Collected") && findParcel.status.includes("pending")) {
            findAssignment.Status = status;
            await findAssignment.save();
        }

        if (status.includes("Return to Sender")) {
            findAssignment.Status = status;
            findAssignment.reason = reason;
            findParcel.status = ["returned"];
            await findParcel.save();
            await findAssignment.save();
        }

        if (status.includes("Delivered")) {
            if (findAssignment.Status.includes("Out for Delivery") || findAssignment.Status.includes("Shipment Sorted at Delivery Facility")) {
                const currentDateTime = new Date();
                findAssignment.Status = ["Delivered"];
                findAssignment.completionPicture = uploadResult.secure_url || ''
                findParcel.status = ["completed"];
                findAssignment.deliveryEndTime = currentDateTime
                await findParcel.save();
                await findAssignment.save();
            } else {
                return res.status(401).json({ message: "Invalid Request" })
            }

        }

        if (status.includes("Undelivered")) {
            if (findAssignment.Status.includes("Out for Delivery") || findAssignment.Status.includes("Shipment Sorted at Delivery Facility")) {
                findAssignment.Status = status;
                await findParcel.save();
                await findAssignment.save();
            } else {
                return res.status(401).json({ message: "Invalid Request" })
            }
        }

        if (status.includes("Shipment Sorted at Delivery Facility")) {
            findAssignment.Status = status;
            await findParcel.save();
            await findAssignment.save();
        }

        if (status.includes("Cancelled")) {
            findParcel.status = ["cancelled"];
            await Assignment.findOneAndDelete({ parcelID: findParcel._id })
            await findParcel.save();
        }

        if (status.includes("Out for Delivery")) {
            if (findAssignment.Status.includes("Shipment Sorted at Delivery Facility")) {
                findAssignment.Status = ["Out for Delivery"];
                await findAssignment.save();
            } else {
                return res.status(401).json({ message: "Invalid Request" })
            }
        }

        findAssignment.Status = status;
        await findAssignment.save();
        res.status(200).json({ message: "Parcel Status Updated Successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

const HandleTransferAssignment = async (req, res) => {
    try {

        const {
            assignmentID,
        } = req.params;

        const findAssignment = await Assignment.findById(assignmentID);
        const findParcel = await parcelSchema.findById(findAssignment.parcelID);
        if (!findAssignment) {
            return res.status(404).json({ message: "Assignment Not Found" });
        }
        if (!findAssignment.transferredFromRiders.includes(findAssignment.riderID)) {
            findAssignment.transferredFromRiders = [...findAssignment.transferredFromRiders, findAssignment.riderID];
            findAssignment.riderID = null;
            findAssignment.Status = ["Order Assigned"]
            findParcel.status = ["Order Received"];
            findAssignment.reason = req.body.reason;
            await findAssignment.save();
            await findParcel.save();
            return res.status(200).json({ message: "Assignment Transfer Successful" })
        } else {
            return res.status(400).json({ message: "Driver has already transferred this assignment" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleTransferReq = async (req, res) => {
    try {
        const {
            assignmentID
        } = req.params;
        const {
            reason
        } = req.body;
        const findAssignment = await Assignment.findById(assignmentID);
        if (!findAssignment) {
            return res.status(404).json({ message: "Assignment Not Found" });
        }
        const findParcel = await parcelSchema.findById(findAssignment.parcelID);
        if (!findParcel) {
            return res.status(404).json({ message: "Parcel Not Found" });
        }
        findAssignment.transferredFromRiders = [...findAssignment.transferredFromRiders, findAssignment.riderID];
        findAssignment.riderID = null;
        findAssignment.Status = ["Shipment Sorted at Delivery Facility"]
        findParcel.status = ["Order Received"];
        findAssignment.reason = reason;
        await findAssignment.save();
        await findParcel.save();
        res.status(200).json({ message: "Transfer Request Sent Successfully" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleGetRiderJobs = async (req, res) => {
    try {

        const { riderID } = req.params;
        const { isHistory } = req.query;

        const findRider = await RiderSchema.findById(riderID) || await UserSchema.findById(riderID) || await SuperAdmin.findById(riderID);

        if (!findRider) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        if (findRider.role.includes("Rider")) {
            if (isHistory === '') {
                const assignments = await Assignment.find({
                    riderID,
                    $or: [
                        {
                            Status: ["Shipment Sorted at Delivery Facility"]
                        },
                        {
                            Status: ["Out for Delivery"]
                        },
                        {
                            Status: ["Delivered"]
                        },
                    ]
                }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);


                return res.status(200).json({ assignments: resolved });

            } else if (isHistory === 'Return to Sender') {
                const assignments = await Assignment.find({ riderID, Status: ["Return to Sender"] }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });

            } else if (isHistory === 'Delivered') {
                const assignments = await Assignment.find({ riderID, Status: ["Delivered"] }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });

            } else if (isHistory === 'Undelivered') {
                const assignments = await Assignment.find({ riderID, Status: ["Undelivered"] }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });

            } else if (isHistory === 'Return to Sender') {
                const assignments = await Assignment.find({ riderID, Status: ["Return to Sender"] }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });

            } else if (isHistory === 'Transfer') {

                const assignments = await Assignment.find({ riderID, Status: ["Transfer"] }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });
            } else if (isHistory === 'History') {

                const assignments = await Assignment.find({
                    riderID, $or: [
                        { Status: ["Delivered"] },
                        { Status: ["Undelivered"] },
                        { Status: ["Return to Sender"] },
                    ]
                }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                const mapAssignment = assignments.map(async (item) => {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: item.parcelID.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                        : [];

                    return {
                        ...item.parcelID.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: item
                    };
                });

                const resolved = await Promise.all(mapAssignment);

                return res.status(200).json({ assignments: resolved });
            } else {
                return res.status(200).json({ message: "Invalid Paramaters" });
            }
        } else if (findRider.role.includes("User")) {
            const findParcels = await parcelSchema.find({ userId: riderID }).select("Status  status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight");

            const mapParcels = findParcels.map(async (parcel) => {
                const mapAssignments = await Assignment.find({ parcelID: parcel._id }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                if (mapAssignments.length === 0) {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: parcel.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === parcel.rateListID.toString())
                        : [];

                    return {
                        ...parcel.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: null
                    };
                }

                const assignmentResults = await Promise.all(
                    mapAssignments.map(async (item) => {
                        const findRateList = await ratelist.findOne({
                            'rateList._id': { $in: item.parcelID.rateListID }
                        });

                        const filteredRateList = findRateList
                            ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                            : [];

                        return {
                            ...item.parcelID.toObject(),
                            rateList: filteredRateList[0] || null,
                            assignment: item
                        };
                    })
                );

                return assignmentResults;
            });
            const resolved = await Promise.all(mapParcels);
            const flatResolved = resolved.flat();
            return res.status(200).json({ assignments: flatResolved });

        } else {
            const findParcels = await parcelSchema.find().select("Status  status  _id haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight");

            const mapParcels = findParcels.map(async (parcel) => {
                const mapAssignments = await Assignment.find({ parcelID: { $in: parcel._id } }).populate({
                    path: "parcelID",
                    model: "parcel",
                    select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
                });

                if (mapAssignments.length === 0) {
                    const findRateList = await ratelist.findOne({
                        'rateList._id': { $in: parcel.rateListID }
                    });

                    const filteredRateList = findRateList
                        ? findRateList.rateList.filter(rate => rate._id.toString() === parcel.rateListID.toString())
                        : [];

                    return {
                        ...parcel.toObject(),
                        rateList: filteredRateList[0] || null,
                        assignment: null
                    };
                }

                const assignmentResults = await Promise.all(
                    mapAssignments.map(async (item) => {
                        const findRateList = await ratelist.findOne({
                            'rateList._id': { $in: item.parcelID.rateListID }
                        });

                        const filteredRateList = findRateList
                            ? findRateList.rateList.filter(rate => rate._id.toString() === item.parcelID.rateListID.toString())
                            : [];

                        return {
                            ...item.parcelID.toObject(),
                            rateList: filteredRateList[0] || null,
                            assignment: item
                        };
                    })
                );

                return assignmentResults;
            });
            const resolved = await Promise.all(mapParcels);
            const flatResolved = resolved.flat();
            return res.status(200).json({ assignments: flatResolved });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleGetSingleJob = async (req, res) => {
    try {

        const { riderID, assignmentID } = req.params;
        const findAssignment = await Assignment.findById(assignmentID).populate({
            path: "branchID",
            model: "branches",
        }).populate({
            path: "assignedFromManager",
            model: "managers",
        }).populate({
            path: "riderGroupID",
            model: "ridersgroup",
        }).populate({
            path: "customerID",
            model: "users",
        }).populate({
            path: "riderID",
            model: "riders",
        }).populate({
            path: "parcelID",
            model: "parcel",
        });
        if (!findAssignment) {
            return res.status(404).json({ message: "Assignment Not Found" });
        }

        if (findAssignment.riderID._id.toString() !== riderID) {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.status(200).json({ assignment: findAssignment });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleAcceptJob = async (req, res) => {
    try {

        const {
            assignmentID,
            riderID,
        } = req.params;

        const findAssignment = await Assignment.findById(assignmentID);
        if (!findAssignment) {
            return res.status(404).json({ message: "Assignment Not Found" })
        }

        if (findAssignment.riderID !== null) {
            return res.status(403).json({ message: "Job Has Already Taken" })
        }

        const currentDateTime = new Date();

        findAssignment.deliveryStartTime = currentDateTime


        findAssignment.riderID = riderID
        await findAssignment.save();

        res.status(200).json({ message: "Job Accepted Successfully", assignment: findAssignment });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const HandleUserCancelParcelID = async (req, res) => {
    try {

        const {
            parcelID,
            userID
        } = req.params;

        let status = req.body.status;

        const findUser = await UserSchema.findById(userID);
        if (!findUser) {
            return res.status(404).json({ message: "User Not Found" });
        }
        const findParcel = await parcelSchema.findById(parcelID);
        if (!findParcel) {
            return res.status(404).json({ message: "Parcel Not Found" });
        }
        if (findParcel.userId.toString() !== userID) {
            return res.status(403).json({ message: "Invalid Request" });
        }

        if (!findParcel.status.includes("pending")) {
            return res.status(403).json({ message: "Contact Your Manager To Cancel Your Parcel" })
        }

        if (status.includes("Cancelled")) {
            findParcel.status = ["cancelled"];
            await findParcel.save();
            return res.status(200).json({ message: "Parcel Status Updated Successfully" })
        } else {
            res.status(200).json({ message: "Invalid Status" })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export {
    HandleUpdateAssignmentStatus,
    HandleGetAssignmentsByBranch,
    HandleTransferAssignment,
    HandleTransferReq,
    HandleGetRiderJobs,
    HandleGetSingleJob,
    HandleAcceptJob,
    HandleUserCancelParcelID
}