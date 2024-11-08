import { v2 as cloudinary } from "cloudinary";
import SuperAdmin from "../models/SuperAdmin.js";
import AdminSchema from "../models/AdminSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import RiderSchema from "../models/RiderSchema.js";
import RidersGroupSchema from "../models/RidersGroupSchema.js";
import BranchSchema from "../models/BranchSchema.js";
import UserSchema from "../models/UserSchema.js";
import ratelist from "../models/ratelist.js";

import csv from "fast-csv";
import { Readable } from "stream";
import mongoose from "mongoose";
import autoMailer from "../utils/AutoMailer.js";

const CreateSupperAdmin = async (req, res) => {
  try {
    const { email, name, password, phone } = req.body;

    // Featured image block
    const imgUrl = req?.files?.profileImg;
    const uploadResult = imgUrl
      ? await cloudinary.uploader.upload(imgUrl.tempFilePath, {
          resource_type: "image",
          folder: "user-profiles",
        })
      : {};

    const restrictCreation = await SuperAdmin.find();

    if (restrictCreation.length === 1) {
      return res.status(400).json({
        message: "Invalid Request, There Can Only Be One Super Admin !",
      });
    }

    const create_Supper_Admin = new SuperAdmin({
      email,
      name,
      phone,
      profileImage: uploadResult.secure_url,
      password,
    });
    await create_Supper_Admin.save();
    return res.status(200).json({
      message: "Supper Admin Created Successfully!",
      create_Supper_Admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, name, password, phone } = req.body;
    const { superAdminID } = req.params;

    // Check if SuperAdmin exists
    const findSupperAdmin = await SuperAdmin.findById(superAdminID);

    if (!findSupperAdmin.role.includes("SuperAdmin")) {
      return res.status(404).json({ message: "SuperAdmin not found!" });
    }
    const findAdmins =
      (await AdminSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await RiderSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await SuperAdmin.findOne({ $or: [{ email }, { phone }] })) ||
      (await ManagerSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await UserSchema.findOne({ $or: [{ email }, { phone }] }));

    if (findAdmins) {
      return res
        .status(400)
        .json({ message: "Email or Phone should be unique!" });
    }
    // Create a new Admin
    const create_Admin = new AdminSchema({
      superAdminID,
      email,
      name,
      phone,
      password,
    });

    await create_Admin.save();

    autoMailer({
      from: "admin@tactix.asia",
      to: create_Admin.email,
      subject: `Welcome to our platform, TACTIX`,
      message: `<h1 style="font-family: Arial, sans-serif; color: #2c3e50;">Welcome to our platform, TACTIX</h1>
            <br/>
            <h3 style="font-family: Arial, sans-serif; color: #34495e;">
              Your account has been created by <strong>${findSupperAdmin.name}</strong>
            </h3>
            <br/>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
              <strong>Email:</strong> ${create_Admin.email}
            </p>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
              <strong>Password:</strong> ${create_Admin.password}
            </p>`,
    });

    return res
      .status(200)
      .json({ message: "Admin Created Successfully!", create_Admin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser =
      (await SuperAdmin.findOne({ email, password })) ||
      (await AdminSchema.findOne({ email, password })) ||
      (await ManagerSchema.findOne({ email, password })) ||
      (await RiderSchema.findOne({ email, password })
        .populate({
          path: "RiderGroup",
          model: "ridersgroup",
          select: "",
        })
        .populate({
          path: "branchID",
          model: "branches",
          select: "",
        })) ||
      (await UserSchema.findOne({ email, password }));

    if (!findUser) {
      const findByPhone =
        (await SuperAdmin.findOne({ phone: email, password })) ||
        (await AdminSchema.findOne({ phone: email, password })) ||
        (await ManagerSchema.findOne({ phone: email, password })) ||
        (await RiderSchema.findOne({ phone: email, password })
          .populate({
            path: "RiderGroup",
            model: "ridersgroup",
            select: "groupname",
          })
          .populate({
            path: "branchID",
            model: "branches",
            select: "branch_name branch_address branch_contact_number",
          })) ||
        (await UserSchema.findOne({ phone: email, password }));

      if (!findByPhone) {
        return res.status(404).json({ message: "Invalid Credentials" });
      }
      if (findByPhone.role.includes("Admin")) {
        const findBranch = await BranchSchema.findOne({
          AdminsId: { $in: findByPhone._id.toString() },
        });
        const data = {
          ...findByPhone.toObject(),
          branchID: findBranch ? findBranch?._id.toString() : null,
          branchName: findBranch ? findBranch?.branch_name : null,
        };

        return res
          .status(200)
          .json({ user: data, message: "Logged In Successfully" });
      } else if (findByPhone.role.includes("Manager")) {
        const findBranch = await BranchSchema.findById(findByPhone?.branchID);
        const data = {
          ...findByPhone.toObject(),
          branchID: findBranch ? findBranch?._id.toString() : null,
          branchName: findBranch ? findBranch?.branch_name : null,
        };

        return res
          .status(200)
          .json({ user: data, message: "Logged In Successfully" });
      } else if (findByPhone.role.includes("Rider")) {
        const findBranch = await BranchSchema.findById(findByPhone.branchID);
        const findRiderGroup = await RidersGroupSchema.findById(
          findByPhone.RiderGroup
        );
        const data = {
          ...findByPhone.toObject(),
          branchID: findBranch ? findBranch?._id.toString() : null,
          branchName: findBranch ? findBranch?.branch_name : null,
          riderGroupName: findRiderGroup ? findRiderGroup?.groupname : null,
        };

        return res
          .status(200)
          .json({ user: data, message: "Logged In Successfully" });
      } else if (findByPhone.role.includes("User")) {
        const findBranch = await BranchSchema.findById(findByPhone.BranchID);
        const data = {
          ...findByPhone.toObject(),
          branchID: findBranch ? findBranch?._id.toString() : null,
          branchName: findBranch ? findBranch?.branch_name : null,
        };
        return res
          .status(200)
          .json({ user: data, message: "Logged In Successfully" });
      }
      return res
        .status(200)
        .json({ user: findByPhone, message: "Logged In Successfully" });
    }

    if (findUser.role.includes("Admin")) {
      const findBranch = await BranchSchema.findOne({
        AdminsId: { $in: findUser._id.toString() },
      });
      const data = {
        ...findUser.toObject(),
        branchID: findBranch ? findBranch?._id.toString() : null,
        branchName: findBranch ? findBranch?.branch_name : null,
      };

      return res
        .status(200)
        .json({ user: data, message: "Logged In Successfully" });
    } else if (findUser.role.includes("Manager")) {
      const findBranch = await BranchSchema.findById(findUser?.branchID);
      const data = {
        ...findUser.toObject(),
        branchID: findBranch ? findBranch?._id.toString() : null,
        branchName: findBranch ? findBranch?.branch_name : null,
      };

      return res
        .status(200)
        .json({ user: data, message: "Logged In Successfully" });
    } else if (findUser.role.includes("Rider")) {
      const findBranch = await BranchSchema.findById(findUser.branchID);
      const findRiderGroup = await RidersGroupSchema.findById(
        findUser.RiderGroup
      );
      const data = {
        ...findUser.toObject(),
        branchID: findBranch ? findBranch?._id.toString() : null,
        branchName: findBranch ? findBranch?.branch_name : null,
        riderGroupName: findRiderGroup ? findRiderGroup?.groupname : null,
      };

      return res
        .status(200)
        .json({ user: data, message: "Logged In Successfully" });
    } else if (findUser.role.includes("User")) {
      const findBranch = await BranchSchema.findById(findUser.BranchID);
      const data = {
        ...findUser.toObject(),
        branchID: findBranch ? findBranch?._id.toString() : null,
        branchName: findBranch ? findBranch?.branch_name : null,
      };
      return res
        .status(200)
        .json({ user: data, message: "Logged In Successfully" });
    }

    res.status(200).json({ user: findUser, message: "Logged In Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetAllAdmins = async (req, res) => {
  try {
    const { superAdminID } = req.params;
    const findSuperAdmin = await SuperAdmin.findById(superAdminID);

    if (!findSuperAdmin) {
      return res.status(401).json({ message: "Unauthorized Request" });
    }

    const findAdmins = await AdminSchema.find();
    res.status(200).json({ createdRoles: findAdmins });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const CreateManagersbyAdmin = async (req, res) => {
  try {
    const { adminID } = req.params;
    const findAdmin = await AdminSchema.findById(adminID);

    const { branchID, email, name, password, phone } = req.body;

    const findBranch = await BranchSchema.findById(branchID);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch not found!" });
    }

    if (!findAdmin) {
      return res.status(404).json({ message: "Internal Server Error!" });
    } else {
      const findManger =
        (await AdminSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await RiderSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await SuperAdmin.findOne({ $or: [{ email }, { phone }] })) ||
        (await ManagerSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await UserSchema.findOne({ $or: [{ email }, { phone }] }));

      if (findManger) {
        return res
          .status(401)
          .json({ message: "Email Or Phone should be unique!" });
      } else {
        const create_manager = new ManagerSchema({
          adminID,
          branchID,
          email,
          name,
          password,
          phone,
        });

        await create_manager.save();

        autoMailer({
          from: "admin@tactix.asia",
          to: create_manager.email,
          subject: `Welcome to our platform, TACTIX`,
          message: `<h1 style="font-family: Arial, sans-serif; color: #2c3e50;">Welcome to our platform, TACTIX</h1>
                    <br/>
                    <h3 style="font-family: Arial, sans-serif; color: #34495e;">
                      Your account has been created by <strong>${findAdmin.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
                    </h3>
                    <br/>
                    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
                      <strong>Email:</strong> ${create_manager.email}
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
                      <strong>Password:</strong> ${create_manager.password}
                    </p>
                    <br/>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
                      For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
                    </p>`,
        });

        return res
          .status(200)
          .json({ message: "Manager Created Successfully!", create_manager });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const createRidersbyManager = async (req, res) => {
  try {
    const { managerID } = req.params;
    const { branchID, email, name, password, RiderGroupId, phone } = req.body;

    const findBranch = await BranchSchema.findById(branchID);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch not found!" });
    }

    const findManager = await ManagerSchema.findById(managerID);

    if (!findManager) {
      return res.status(404).json({ message: "Manager not found" });
    } else {
      const findRider =
        (await AdminSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await RiderSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await SuperAdmin.findOne({ $or: [{ email }, { phone }] })) ||
        (await ManagerSchema.findOne({ $or: [{ email }, { phone }] })) ||
        (await UserSchema.findOne({ $or: [{ email }, { phone }] }));

      if (findRider) {
        return res
          .status(401)
          .json({ message: "Driver Already Exists with this email!" });
      } else {
        const findRiderGroup = await RidersGroupSchema.findById(RiderGroupId);

        if (!findRiderGroup) {
          return res.status(401).json({
            message: "Driver Crew  Not Selected Please Select Driver Crew!",
          });
        }

        const create_manager = new RiderSchema({
          managerID: findManager._id,
          branchID,
          RiderGroup: findRiderGroup._id,
          email,
          name,
          password,
          phone,
        });
        await create_manager.save();

        autoMailer({
          from: "admin@tactix.asia",
          to: create_manager.email,
          subject: `Welcome to our platform, TACTIX`,
          message: ` < h1 style="font-family: Arial, sans-serif; color: #2c3e50;" > Welcome to our platform, TACTIX</>
                    <br/>
                    <h3 style="font-family: Arial, sans-serif; color: #34495e;">
                      Your account has been created by <strong>${findManager.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
                    </h3>
                    <br/>
                    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
                      <strong>Email:</strong> ${create_manager.email}
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
                      <strong>Password:</strong> ${create_manager.password}
                    </p>
                    <br/>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
                      For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
                    </p>`,
        });

        return res
          .status(200)
          .json({ message: "Manager Created Successfully!", create_manager });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, name, password, rateList, phone } = req.body;
    const { BranchId, managerID } = req.params;

    const findBranch = await BranchSchema.findById(BranchId);
    const findManager = await ManagerSchema.findById(managerID);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }
    if (!findManager) {
      return res.status(404).json({ message: "Manager Not Found!" });
    }

    const findUser =
      (await AdminSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await RiderSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await SuperAdmin.findOne({ $or: [{ email }, { phone }] })) ||
      (await ManagerSchema.findOne({ $or: [{ email }, { phone }] })) ||
      (await UserSchema.findOne({ $or: [{ email }, { phone }] }));
    if (findUser) {
      return res
        .status(400)
        .json({ message: "Email or Phone Already Exists!" });
    }

    const CreateUser = await UserSchema({
      email,
      name,
      password,
      phone,
      BranchID: findBranch._id,
    });
    await CreateUser.save();

    if (!Array.isArray(rateList)) {
      return res.status(404).json({ message: "Invalid RateList Format" });
    }

    rateList.forEach((item) => {
      const fromLocation = item?.from?.trim()?.toLowerCase();
      const toLocation = item?.to?.trim()?.toLowerCase();

      if (fromLocation === toLocation) {
        return res
          .status(400)
          .json({ message: "From and To locations can't be the same" });
      }

      if (item?.price <= 0) {
        return res
          .status(400)
          .json({ message: "Price can't be zero or negative" });
      }
    });

    const newRateList = new ratelist({
      managerID,
      branchID: BranchId,
      userID: CreateUser._id,
      rateList,
    });
    await newRateList.save();

    autoMailer({
      from: "admin@tactix.asia",
      to: CreateUser.email,
      subject: "Welcome to our platform, TACTIX",
      message: `
            <h3 style="font-family: Arial, sans-serif; color: #34495e;">
              Your account has been created by <strong>${findManager.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
            </h3>
            <br/>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
              <strong>Email:</strong> ${CreateUser.email}
            </p>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50;">
              <strong>Password:</strong> ${CreateUser.password}
            </p>
            <br/>
            <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
              For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
            </p>`,
    });

    res.status(200).json({ message: "User Created Succesfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getUserbyBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const findBranch = await BranchSchema.findById(branchId);

    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    } else {
      const BranchUsers = await UserSchema.find({ BranchID: branchId });
      const map = BranchUsers.map(async (item) => {
        const findRateList = await ratelist.findOne({
          branchID: branchId,
          userID: item._id,
        });

        return {
          ...item.toObject(),
          rateList: findRateList,
        };
      });
      const data = await Promise.all(map);
      return res.status(200).json({ message: "All Branch users!", data });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getallRidersofGroup = async (req, res) => {
  try {
    const { GroupID } = req.params;

    const findGroup = await RidersGroupSchema.findById(GroupID);

    if (!findGroup) {
      return res.status(404).json({ message: "Driver Crew Not Found!" });
    } else {
      const findGroupRiders = await RiderSchema.find({ RiderGroup: GroupID });

      return res
        .status(200)
        .json({ message: "Driver Crew Of Driver", findGroupRiders });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleUpdateUser = async (req, res) => {
  try {
    const { managerID, branchID, userID } = req.params;
    const { rateList, email, name, password } = req.body;

    const findManager = await ManagerSchema.findById(managerID);
    const findBranch = await BranchSchema.findById(branchID);
    const findUser = await UserSchema.findById(userID);

    if (!findManager || !findBranch || !findUser) {
      return res
        .status(404)
        .json({ message: "User or Branch or Manager not found!" });
    }
    if (!Array.isArray(rateList)) {
      return res.status(400).json({ message: "Invalid RateList Format" });
    }

    const existingRateList = await RateListModel.findOne({
      managerID,
      branchID,
      userID,
    });

    if (!existingRateList) {
      return res.status(404).json({ message: "Rate List not found!" });
    }

    const mergedRateList = [...existingRateList.rateList];

    rateList.forEach((item) => {
      const fromLocation = item?.from?.trim()?.toLowerCase();
      const toLocation = item?.to?.trim()?.toLowerCase();

      if (fromLocation === toLocation) {
        return res
          .status(400)
          .json({ message: "From and To locations can't be the same" });
      }

      if (item?.price <= 0) {
        return res
          .status(400)
          .json({ message: "Price can't be zero or negative" });
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

    findUser.email = email || findUser.email;
    findUser.name = name || findUser.name;
    findUser.password = password || findUser.password;
    existingRateList.rateList = mergedRateList;
    await existingRateList.save();

    res.status(200).json({
      message: "Rate List Updated Successfully!",
      updatedRateList: existingRateList,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const findUser =
      (await UserSchema.findById(userId)) ||
      (await RiderSchema.findById(userId)) ||
      (await ManagerSchema.findById(userId)) ||
      (await SuperAdmin.findById(userId)) ||
      (await AdminSchema.findById(userId));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    if (findUser.role.includes("User")) {
      const findRateList = await ratelist.findOne({ userID: findUser._id });
      return res.status(200).json({
        message: "Single User Data!",
        findUser,
        rateList: findRateList,
      });
    }
    res.status(200).json({ message: "Single User Data!", findUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleUpdateRole = async (req, res) => {
  try {
    const { id } = req.params;

    const findUser =
      (await AdminSchema.findById(id)) ||
      (await RiderSchema.findById(id)) ||
      (await SuperAdmin.findById(id)) ||
      (await ManagerSchema.findById(id)) ||
      (await UserSchema.findById(id));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    if (findUser.role.includes("SuperAdmin")) {
      findUser.email = req.body.email || findUser.email;
      findUser.name = req.body.name || findUser.name;
      findUser.password = req.body.password || findUser.password;
      findUser.phone = req.body.phone || findUser.phone;
      const profileImage = req?.files?.profileImage;
      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;
      await findUser.save();
      return res
        .status(200)
        .json({ message: "Profile Updated Successfully!", user: findUser });
    } else if (findUser.role.includes("Admin")) {
      findUser.email = req.body.email || findUser.email;
      findUser.name = req.body.name || findUser.name;
      findUser.password = req.body.password || findUser.password;
      findUser.phone = req.body.phone || findUser.phone;
      const profileImage = req?.files?.profileImage;
      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;
      await findUser.save();
      return res
        .status(200)
        .json({ message: "Profile Updated Successfully!", user: findUser });
    } else if (findUser.role.includes("Manager")) {
      findUser.email = req.body.email || findUser.email;
      findUser.name = req.body.name || findUser.name;
      findUser.password = req.body.password || findUser.password;
      findUser.phone = req.body.phone || findUser.phone;
      const profileImage = req?.files?.profileImage;
      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;
      await findUser.save();
      return res
        .status(200)
        .json({ message: "Profile Updated Successfully!", user: findUser });
    } else if (findUser.role.includes("Rider")) {
      findUser.email = req.body.email || findUser.email;
      findUser.name = req.body.name || findUser.name;
      findUser.password = req.body.password || findUser.password;
      findUser.phone = req.body.phone || findUser.phone;
      const profileImage = req?.files?.profileImage;

      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;

      await findUser.save();

      const response = await RiderSchema.findById(findUser._id)
        .populate({
          path: "RiderGroup",
          model: "ridersgroup",
          select: "groupname",
        })
        .populate({
          path: "branchID",
          model: "branches",
          select: "branch_name branch_address branch_contact_number",
        });

      return res
        .status(200)
        .json({ message: "Profile Updated Successfully!", user: response });
    } else if (findUser.role.includes("User")) {
      findUser.email = req.body.email || findUser.email;
      findUser.name = req.body.name || findUser.name;
      findUser.password = req.body.password || findUser.password;
      findUser.phone = req.body.phone || findUser.phone;

      if (Array.isArray(req?.body?.rateList)) {
        const existingRateList = await ratelist.findOne({ userID: id });
        if (!existingRateList) {
          return res.status(404).json({ message: "Rate List not found!" });
        }

        const mergedRateList = [...existingRateList.rateList];

        req.body.rateList.forEach((item) => {
          const fromLocation = item?.from?.trim()?.toLowerCase();
          const toLocation = item?.to?.trim()?.toLowerCase();

          if (fromLocation === toLocation) {
            return res
              .status(400)
              .json({ message: "From and To locations can't be the same" });
          }

          if (item?.price <= 0) {
            return res
              .status(400)
              .json({ message: "Price can't be zero or negative" });
          }

          const exists = mergedRateList.some((rate) => {
            const existingFrom = rate.from.trim().toLowerCase();
            const existingTo = rate.to.trim().toLowerCase();

            return (
              existingFrom === fromLocation &&
              existingTo === toLocation &&
              rate.price === item.price &&
              JSON.stringify(rate.shipmentType) ===
                JSON.stringify(item.shipmentType)
            );
          });

          if (!exists) {
            mergedRateList.push(item);
          }
        });

        existingRateList.rateList = mergedRateList;
        await existingRateList.save();
      }

      const profileImage = req?.files?.profileImage;
      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;

      await findUser.save();

      return res
        .status(200)
        .json({ message: "Profile Updated Successfully!", user: findUser });
    } else {
      return res.status(400).json({ message: "Bad Request" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

// Bulk Upload RateList API
const HandleUploadBulkRateList = async (req, res) => {
  try {
    const { rateListID } = req.params;

    const file = req.files?.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto",
      folder: "parcel-data",
    });

    const uploadUrl = uploadResult.secure_url;

    const dataArray = [];
    const invalidDataArray = [];

    // Make a request to the URL using fetch
    const response = await fetch(uploadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = await reader.read();
    let csvString = "";

    while (!result.done) {
      csvString += decoder.decode(result.value, { stream: true });
      result = await reader.read();
    }

    const csvStream = Readable.from(csvString);

    csvStream
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        res.status(500).json({ message: "Error parsing CSV" });
      })
      .on("data", async function (rowData) {
        const hasAllRequiredFields =
          rowData.to &&
          rowData.from &&
          rowData.price &&
          (rowData.shipmentType === "Premium" ||
            rowData.shipmentType === "Express" ||
            rowData.shipmentType === "Economy" ||
            rowData.shipmentType === "Others ");

        if (hasAllRequiredFields) {
          const modifiedData = {
            _id: new mongoose.Types.ObjectId(),
            to: String(rowData.to),
            from: String(rowData.from),
            price: Number(rowData.price),
            shipmentType: String(rowData.shipmentType),
          };
          dataArray.push(modifiedData);
        } else {
          invalidDataArray.push({
            rowData,
            missingFields: {
              to: !rowData.to ? "to field is required" : null,
              from: !rowData.from ? "from field is required" : null,
              price: !rowData.price ? "price field is required" : null,
              shipmentType: !rowData.shipmentType
                ? "shipmentType field is required"
                : !["Premium", "Express", "Economy", "Others"].includes(
                    rowData.shipmentType
                  )
                ? "Invalid Shipment Type"
                : null,
            },
          });
        }
      })
      .on("end", async function () {
        const findRateList = await ratelist.findById(rateListID);
        if (!findRateList) {
          return res.status(404).json({ message: "Rate List not found!" });
        }
        findRateList.rateList = [...findRateList.rateList, ...dataArray];
        await findRateList.save();
        res.status(200).json({
          message: "Upload processed",
          validData: dataArray,
          invalidData: invalidDataArray.length > 0 ? invalidDataArray : null,
          rateList: findRateList,
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleCreateBulkRateList = async (req, res) => {
  try {
    const file = req.files?.file;

    const { branchID } = req.params;

    const findBranch = await BranchSchema.findById(branchID);
    if (!findBranch) {
      return res.status(401).json({ message: "Invalid Request" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto",
      folder: "parcel-data",
    });

    const uploadUrl = uploadResult.secure_url;

    const dataArray = [];
    const invalidDataArray = [];

    // Make a request to the URL using fetch
    const response = await fetch(uploadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = await reader.read();
    let csvString = "";

    while (!result.done) {
      csvString += decoder.decode(result.value, { stream: true });
      result = await reader.read();
    }

    const csvStream = Readable.from(csvString);

    csvStream
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        res.status(500).json({ message: "Error parsing CSV" });
      })
      .on("data", async function (rowData) {
        const hasAllRequiredFields =
          rowData.to &&
          rowData.from &&
          rowData.price &&
          (rowData.shipmentType === "Premium" ||
            rowData.shipmentType === "Express" ||
            rowData.shipmentType === "Economy" ||
            rowData.shipmentType === "Others ");

        if (hasAllRequiredFields) {
          const modifiedData = {
            _id: new mongoose.Types.ObjectId(),
            to: String(rowData.to),
            from: String(rowData.from),
            price: Number(rowData.price),
            shipmentType: String(rowData.shipmentType),
          };
          dataArray.push(modifiedData);
        } else {
          invalidDataArray.push({
            rowData,
            missingFields: {
              to: !rowData.to ? "to field is required" : null,
              from: !rowData.from ? "from field is required" : null,
              price: !rowData.price ? "price field is required" : null,
              shipmentType: !rowData.shipmentType
                ? "shipmentType field is required"
                : !["Premium", "Express", "Economy", "Others"].includes(
                    rowData.shipmentType
                  )
                ? "Invalid Shipment Type"
                : null,
            },
          });
        }
      })
      .on("end", async function () {
        res.status(200).json({
          message: "Upload processed",
          validData: dataArray,
          invalidData: invalidDataArray.length > 0 ? invalidDataArray : null,
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleCreateBulkRateListUpdateUser = async (req, res) => {
  try {
    const file = req.files?.file;
    const { branchID } = req.params;
    const userID = req.body.userID;

    const findBranch = await BranchSchema.findById(branchID);
    if (!findBranch) {
      return res.status(401).json({ message: "Invalid Request" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: "auto",
      folder: "parcel-data",
    });
    const uploadUrl = uploadResult.secure_url;

    const dataArray = [];
    const invalidDataArray = [];
    const duplicateData = [];

    const response = await fetch(uploadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = await reader.read();
    let csvString = "";

    while (!result.done) {
      csvString += decoder.decode(result.value, { stream: true });
      result = await reader.read();
    }

    const csvStream = Readable.from(csvString);

    const dataPromises = [];

    csvStream
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        res.status(500).json({ message: "Error parsing CSV" });
      })
      .on("data", (rowData) => {
        const dataPromise = (async () => {
          const findExistingData = await ratelist.findOne({
            userID,
            "rateList.to": rowData.to,
            "rateList.from": rowData.from,
            "rateList.shipmentType": rowData.shipmentType,
          });

          if (findExistingData) {
            duplicateData.push({
              rowData,
              duplicateData: {
                to: rowData.to,
                from: rowData.from,
                shipmentType: rowData.shipmentType,
              },
            });
          } else {
            const hasAllRequiredFields =
              rowData.to &&
              rowData.from &&
              rowData.price &&
              ["Premium", "Express", "Economy", "Others"].includes(
                rowData.shipmentType
              );

            if (hasAllRequiredFields) {
              const modifiedData = {
                _id: new mongoose.Types.ObjectId(),
                to: String(rowData.to),
                from: String(rowData.from),
                price: Number(rowData.price),
                shipmentType: String(rowData.shipmentType),
              };
              dataArray.push(modifiedData);
            } else {
              invalidDataArray.push({
                rowData,
                missingFields: {
                  to: !rowData.to ? "to field is required" : null,
                  from: !rowData.from ? "from field is required" : null,
                  price: !rowData.price ? "price field is required" : null,
                  shipmentType: !rowData.shipmentType
                    ? "shipmentType field is required"
                    : !["Premium", "Express", "Economy", "Others"].includes(
                        rowData.shipmentType
                      )
                    ? "Invalid Shipment Type"
                    : null,
                },
              });
            }
          }
        })();
        dataPromises.push(dataPromise);
      })
      .on("end", async () => {
        await Promise.all(dataPromises);

        if (duplicateData.length > 0) {
          return res.status(400).json({
            message: "Duplicate entries found",
            duplicateData: duplicateData,
          });
        }

        if (invalidDataArray.length > 0) {
          return res.status(400).json({
            message: "Upload contains invalid data",
            validData: dataArray,
            invalidData: invalidDataArray,
          });
        }

        return res.status(200).json({
          message: "Upload processed successfully",
          validData: dataArray,
          invalidData: invalidDataArray.length > 0 ? invalidDataArray : null,
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  CreateSupperAdmin,
  createAdmin,
  Login,
  HandleGetAllAdmins,
  CreateManagersbyAdmin,
  createRidersbyManager,
  createUser,
  getUserbyBranch,
  getallRidersofGroup,
  HandleUpdateUser,
  getSingleUser,
  HandleUpdateRole,
  HandleUploadBulkRateList,
  HandleCreateBulkRateList,
  HandleCreateBulkRateListUpdateUser,
};
