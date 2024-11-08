import AdminSchema from "../models/AdminSchema.js";
import Assignment from "../models/Assignment.js";
import BranchSchema from "../models/BranchSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import parcelSchema from "../models/parcelSchema.js";
import ratelist from "../models/ratelist.js";
import RidersGroupSchema from "../models/RidersGroupSchema.js";
import SuperAdminSchema from "../models/SuperAdmin.js";
import UserSchema from "../models/UserSchema.js";

const createBranch = async (req, res) => {
  try {
    const { branch_name, branch_address, branch_contact_number } = req.body;
    const { superAdminID } = req.params;

    // Check if SuperAdmin exists
    const findSupperAdmin = await SuperAdminSchema.findById(superAdminID);
    if (!findSupperAdmin.role.includes("SuperAdmin")) {
      return res.status(404).json({ message: "SuperAdmin not found!" });
    }
    const findBranch = await BranchSchema.findOne({
      $or: [{ branch_address: branch_address }, { branch_name: branch_name }],
    });

    if (findBranch) {
      return res
        .status(400)
        .json({ message: "Branch Address Or Branch Name Should be Unqiue!" });
    }

    // Create a new Admin
    const create_Branch = new BranchSchema({
      superAdminID,
      branch_name,
      branch_address,
      branch_contact_number,
    });

    await create_Branch.save();
    return res
      .status(200)
      .json({ message: "Branch Created Successfully!", create_Branch });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAllBranchesforSupperAdmin = async (req, res) => {
  try {
    const { superAdminID } = req.params;

    const findSuperAdmin = await SuperAdminSchema.findById(superAdminID);

    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Supper Admin Not Found!" });
    } else {
      const allbranches = await BranchSchema.find();
      // const branchIDs = allbranches.map(branch => branch._id);
      // const findParcels = await parcelSchema.find({ branchID: { $in: branchIDs } });
      // const includeRatelist = findParcels.map(async (item) => {
      //     const findRateList = await ratelist.findOne({ 'rateList._id': item.rateListID });
      //     const filteredRateList = findRateList
      //         ? findRateList.rateList.filter(rateID => rateID._id.toString() === item.rateListID.toString())
      //         : [];
      //     const findAssignment = await Assignment.findOne({ parcelID: item._id });
      //     return {
      //         ...item.toObject(),
      //         rateList: filteredRateList,
      //         assignment: findAssignment || null,
      //     };
      // });

      // const resolved = await Promise.all(includeRatelist);
      return res.status(200).json({
        message: "all branches",
        allbranches: allbranches,
        // resolved
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const AsignBranchToAdmin = async (req, res) => {
  try {
    const { SuperAdminId, branchId } = req.params;
    const { AdminIds } = req.body;

    const findSuperAdmin = await SuperAdminSchema.findById(SuperAdminId);
    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Super Admin Not Found!" });
    }

    if (!Array.isArray(AdminIds) || AdminIds.length === 0) {
      return res
        .status(400)
        .json({
          message: "Invalid Format! AdminIds should be a non-empty array.",
        });
    }

    const findBranch = await BranchSchema.findById(branchId);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }

    const results = await Promise.all(
      AdminIds.map(async (adminId) => {
        const findAdmin = await AdminSchema.findById(adminId);
        if (!findAdmin) {
          return { error: true, message: `${adminId} doesn't exist` };
        }

        const branchWithAdmin = await BranchSchema.findOne({
          AdminsId: adminId,
        });
        if (branchWithAdmin) {
          return {
            error: true,
            message: `${findAdmin.name} has already been assigned to branch ${branchWithAdmin.branch_name}!`,
          };
        }

        return { error: false };
      })
    );

    const errorResult = results.find((result) => result.error);
    if (errorResult) {
      return res.status(400).json({ message: errorResult.message });
    }

    const existingAdminIds = findBranch.AdminsId || [];
    const newAdminIds = AdminIds.filter((id) => !existingAdminIds.includes(id));
    findBranch.AdminsId = [...new Set([...existingAdminIds, ...newAdminIds])];

    // Save updated branch
    await findBranch.save();
    return res.status(200).json({ message: "Branch Assigned Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getAdminBranches = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdmin = await AdminSchema.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    } else {
      const findAdminBranches = await BranchSchema.find({
        AdminsId: { $in: AdminId },
      });
      return res
        .status(200)
        .json({ message: "Admin Branches", findAdminBranches });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const GetManagersbybranch = async (req, res) => {
  try {
    const { adminID } = req.params;

    const findAdmin = await AdminSchema.findById(adminID);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const findAdminBranches = await BranchSchema.find({
      AdminsId: { $in: adminID },
    });

    const branchIds = findAdminBranches.map((branch) => branch._id);

    const findManagers = await ManagerSchema.find({
      branchID: { $in: branchIds },
    });

    return res.status(200).json({
      message: "Managers Found",
      managers: findManagers,
      // branches: findAdminBranches
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getSingleBranch = async (req, res) => {
  try {
    const { branchID } = req.params;
    const findBranch = await BranchSchema.findById(branchID).populate({
      path: "AdminsId",
      model: "admins",
      select: "-password",
    });
    const findParcels = await parcelSchema.find({ branchID: branchID })
    const includeRatelist = findParcels.map(async (item) => {
      const findRateList = await ratelist.findOne({
        "rateList._id": item.rateListID,
      });
      const filteredRateList = findRateList.rateList.filter(
        (rateID) => rateID._id.toString() === item.rateListID.toString()
      );
      const findAssignment = await Assignment.findOne({
        parcelID: item._id,
      }).populate({
        path: "parcelID",
        model: "parcel",
        select: "Status status _id  haveOwnTrackID ownTrackID parcelName rateListID reciverAddress SenderAddress CodCharges CodAmount isDamaged weight",
      }).populate({
        path: "customerID",
        model: "users",
        select: "",
    });
      return {
        ...item.toObject(),
        rateList: filteredRateList[0] || null,
        assignment: findAssignment,
      };
    });

    const resolved = await Promise.all(includeRatelist);
    const riders_group = await RidersGroupSchema.find({ BranchID: branchID });

    const users = await UserSchema.find({ branchID });

    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }

    res
      .status(200)
      .json({
        message: "Branch Found",
        findBranch,
        parcels: resolved,
        riders_group,
        users,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleUpdateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, branch_address, branch_contact_number } = req.body;

    const findBranch = await BranchSchema.findByIdAndUpdate(id);

    findBranch.branch_name = branch_name || findBranch.branch_name;
    findBranch.branch_address = branch_address || findBranch.branch_address;
    findBranch.branch_contact_number =
      branch_contact_number || findBranch.branch_contact_number;

    await findBranch.save();

    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }
    res
      .status(200)
      .json({ message: "Branch Updated Successfully!", branch: findBranch });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  createBranch,
  getAllBranchesforSupperAdmin,
  AsignBranchToAdmin,
  getAdminBranches,
  GetManagersbybranch,
  getSingleBranch,
  HandleUpdateBranch,
};
