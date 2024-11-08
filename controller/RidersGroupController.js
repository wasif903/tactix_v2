import AdminSchema from "../models/AdminSchema.js";
import BranchSchema from "../models/BranchSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import RidersGroupSchema from "../models/RidersGroupSchema.js";
import SuperAdmin from "../models/SuperAdmin.js";



const CreateRiderGroup = async (req, res) => {
    try {
        const { groupname } = req.body;
        const { BranchManagerID, BranchID } = req.params;

        const findBranchManager = await ManagerSchema.findById(BranchManagerID);

        if (!groupname) {
            return res.status(400).json({ message: "Crew Name Is Required" });
        }

        const findBranch = await BranchSchema.findById(BranchID);
        if (!findBranch) {
            return res.status(404).json({ message: "Branch Not Found" })
        }
        if (!findBranchManager) {
            return res.status(404).json({ message: "Branch Manager Not Found!" })
        } else {
            const findgroup = await RidersGroupSchema.findOne({ groupname: groupname });

            if (findgroup) {
                return res.status(400).json({ message: "Driver Crew Name already Exists" });

            } else {
                const createRiderGroup = await RidersGroupSchema({
                    BranchManagerID: findBranchManager._id,
                    BranchID: findBranch._id,
                    groupname
                });
                createRiderGroup.save();
                return res.status(200).json({ message: "Driver Crew Created Succesfully" })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" })
    }
}

const GetRidersGroup = async (req, res) => {
    try {
        const { BranchManagerID } = req.params;

        const findBranchmanager = await ManagerSchema.findById(BranchManagerID);

        if (!findBranchmanager) {
            return res.status(404).json({ message: "Branch Manager Not Found!" })
        } else {
            const RidersGroup = await RidersGroupSchema.find({ BranchManagerID: findBranchmanager._id }).populate({
                path: "BranchManagerID",
                model: "managers",
                select: "-password"
            })

            return res.status(200).json({ message: "All Driver Crew", RidersGroup });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" })
    }
}

const GetRidersGroupForAdmin = async (req, res) => {
    try {
        const { AdminId } = req.params;
        const findAdmin = await AdminSchema.findById(AdminId);

        if (!findAdmin) {
            return res.status(404).json({ message: "Invalid Request" })
        }

        const findBranch = await BranchSchema.find({ AdminsId: { $in: findAdmin._id.toString() } });

        const extractBranchIds = findBranch.map((item) => item._id.toString());

        const findRiderGroups = await RidersGroupSchema.find({ BranchID: { $in: extractBranchIds } }).populate({
            path: 'BranchManagerID',
            model: "managers",
            select: "-password"
        });

        res.status(200).json({ message: "All Branches Driver Crew!", findRiderGroups })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" })
    }
}

const getRiderGroupforSuperAdmin = async (req, res) => {
    try {
        const { superAdminID } = req.params;
        const findSuperAdmin = await SuperAdmin.findById(superAdminID);

        if (!findSuperAdmin) {
            return res.status(404).json({ message: "Invalid Request" })
        }

        const findRiderGroups = await RidersGroupSchema.find().populate({
            path: 'BranchManagerID',
            model: "managers",
            select: "-password"
        });

        res.status(200).json({ message: "All Branches Driver Crew!", findRiderGroups })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" })
    }
}

const getRidersGroupByBranchID = async (req, res) => {
    try {

        const { BranchID } = req.params;
        const findRiderGroups = await RidersGroupSchema.find({ BranchID: BranchID }).populate({
            path: 'BranchManagerID',
            model: "managers",
            select: "-password"
        }).populate({
            path: 'BranchID',
            model: "branches",
            select: ""
        });
        res.status(200).json({ message: "All Driver Crew", findRiderGroups });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}




export {
    CreateRiderGroup,
    GetRidersGroup,
    GetRidersGroupForAdmin,
    getRiderGroupforSuperAdmin,
    getRidersGroupByBranchID
}