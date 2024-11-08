import BranchSchema from "../models/BranchSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import ratelist from "../models/ratelist.js";
import UserSchema from "../models/UserSchema.js";


// @POST 
// {{endpoint}}/ratelist/managerID/branchID/create-ratelist/userID
const HandleCreateRateList = async (req, res) => {
    try {

        const { managerID, branchID, userID } = req.params;
        const { rateList } = req.body;

        const findManager = await ManagerSchema.findById(managerID);
        const findBranch = await BranchSchema.findById(branchID);
        const findUser = await UserSchema.findById(userID);

        if (!findManager || !findBranch || !findUser) {
            return res.status(404).json({ message: "User or Branch or Manager not found!" });
        }

        if (!Array.isArray(rateList)) {
            return res.status(404).json({ message: "Invalid RateList Format" });
        }

        rateList.forEach((item) => {
            const fromLocation = item?.from?.trim()?.toLowerCase();
            const toLocation = item?.to?.trim()?.toLowerCase();

            if (fromLocation === toLocation) {
                return res.status(400).json({ message: "From and To locations can't be the same" });
            }

            if (item?.price <= 0) {
                return res.status(400).json({ message: "Price can't be zero or negative" });
            }
        });

        const newRateList = new ratelist({
            managerID,
            branchID,
            userID,
            rateList,
        });
        await newRateList.save();

        res.status(200).json({ message: "Rate List Created Successfully!", newRateList });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
}


// @PATCH
// {{endpoint}}/ratelist/managerID/branchID/update-ratelist/userID
const HandleUpdateRateList = async (req, res) => {
    try {
        const { managerID, branchID, userID } = req.params;
        const { rateList } = req.body;

        const findManager = await ManagerSchema.findById(managerID);
        const findBranch = await BranchSchema.findById(branchID);
        const findUser = await UserSchema.findById(userID);

        if (!findManager || !findBranch || !findUser) {
            return res.status(404).json({ message: "User or Branch or Manager not found!" });
        }

        if (!Array.isArray(rateList)) {
            return res.status(400).json({ message: "Invalid RateList Format" });
        }

        const existingRateList = await RateListModel.findOne({
            managerID,
            branchID,
            userID
        });

        if (!existingRateList) {
            return res.status(404).json({ message: "Rate List not found!" });
        }

        const mergedRateList = [...existingRateList.rateList];

        rateList.forEach((item) => {
            const fromLocation = item?.from?.trim()?.toLowerCase();
            const toLocation = item?.to?.trim()?.toLowerCase();

            if (fromLocation === toLocation) {
                return res.status(400).json({ message: "From and To locations can't be the same" });
            }

            if (item?.price <= 0) {
                return res.status(400).json({ message: "Price can't be zero or negative" });
            }

            const exists = mergedRateList.some((rate) => {
                const existingFrom = rate.from.trim().toLowerCase();
                const existingTo = rate.to.trim().toLowerCase();
                return existingFrom === fromLocation && existingTo === toLocation;
            });

            if (!exists) {
                mergedRateList.push(item);
            }
        });

        existingRateList.rateList = mergedRateList;
        await existingRateList.save();

        res.status(200).json({ message: "Rate List Updated Successfully!", updatedRateList: existingRateList });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// @PATCH
// {{endpoint}}/ratelist/managerID/branchID/delete-ratelist/userID/rateListID
const HandleDeleteRateById = async (req, res) => {
    try {
        const { managerID, branchID, userID, rateListID } = req.params;

        const findManager = await ManagerSchema.findById(managerID);
        const findBranch = await BranchSchema.findById(branchID);
        const findUser = await UserSchema.findById(userID);

        if (!findManager || !findBranch || !findUser) {
            return res.status(404).json({ message: "User or Branch or Manager not found!" });
        }

        const existingRateList = await RateListModel.findOne({
            managerID,
            branchID,
            userID
        });

        if (!existingRateList) {
            return res.status(404).json({ message: "Rate List not found!" });
        }

        const updatedRateList = existingRateList.rateList.filter(
            (item) => item._id.toString() !== rateListID
        );

        if (updatedRateList.length === existingRateList.rateList.length) {
            return res.status(404).json({ message: "No matching rate found to delete!" });
        }

        existingRateList.rateList = updatedRateList;
        await existingRateList.save();

        res.status(200).json({ message: "Rate deleted successfully!", updatedRateList: existingRateList });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// @GET
// {{endpoint}}/ratelist/managerID/branchID/get-ratelist/userID
const HandleGetRateList = async (req, res) => {
    try {
        const { managerID, branchID, userID } = req.params;

        const findManager = await ManagerSchema.findById(managerID);
        const findBranch = await BranchSchema.findById(branchID);
        const findUser = await UserSchema.findById(userID);

        if (!findManager || !findBranch || !findUser) {
            return res.status(404).json({ message: "User or Branch or Manager not found!" });
        }

        const existingRateList = await RateListModel.findOne({
            managerID,
            branchID,
            userID
        });

        if (!existingRateList) {
            return res.status(404).json({ message: "Rate List not found!" });
        }

        res.status(200).json({ message: "Rate List Found!", rateList: existingRateList });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
}

// @GET
// {{endpoint}}/ratelist/:managerID/:branchID/get-ratelist/:userID/:rateListID
const HandleGetSingleRateList = async (req, res) => {
    try {
        const { managerID, branchID, userID, rateListID } = req.params;

        const findManager = await ManagerSchema.findById(managerID);
        const findBranch = await BranchSchema.findById(branchID);
        const findUser = await UserSchema.findById(userID);
        const findRateList = await RateListModel.findById(rateListID);

        if (!findManager || !findBranch || !findUser || !findRateList) {
            return res.status(404).json({ message: "User or Branch or Manager or Rate List not found!" });
        }

        if (findRateList.userID.toString() !== userID) {
            return res.status(401).json({ message: "Unauthorized access!" });
        }

        res.status(200).json({ rateList: findRateList });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
}


// @PATCH 
// {{endpoint}}/ratelist/:managerID/:branchID/bulk-upload-ratelist/:userID/:rateListID


export { HandleCreateRateList, HandleUpdateRateList, HandleDeleteRateById, HandleGetRateList, HandleGetSingleRateList };