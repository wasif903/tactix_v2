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

    if (!Array.isArray(rateList)) {
      return res.status(404).json({ message: "Invalid RateList Format" });
    }

    const errors = [];
    const uniqueCombinations = new Set();

    await Promise.all(
      rateList.map(async (priceList) => {
        if (
          priceList.zipCodeRangeEnd === "" ||
          !(
            priceList.zipCodeRangeEnd.length >= 5 &&
            priceList.zipCodeRangeEnd.length <= 9
          )
        ) {
          errors.push({
            ...priceList,
            message:
              "Zip Code Range End is required and must be greater than 5 and less than 9",
          });
        }
        if (
          priceList.zipCodeRangeStart === "" ||
          !(
            priceList.zipCodeRangeStart.length >= 5 &&
            priceList.zipCodeRangeStart.length <= 9
          )
        ) {
          errors.push({
            ...priceList,
            message:
              "Zip Code Range Start is required and must be greater than 5 and less than 9",
          });
        }

        if (priceList?.rates === 0) {
          errors.push({ ...priceList, message: "Rates can't be zero" });
        }

        if (Number(priceList?.weight) === 0) {
          errors.push({ ...priceList, message: "Weights can't be zero" });
        }

        const uniqueKey = `${priceList.state} / ${priceList.city}-${priceList.shipmentType}-${priceList.shipmentCategory}`;

        if (uniqueCombinations.has(uniqueKey)) {
          errors.push({
            ...priceList,
            message: "Duplicate city with the same shipment type and category",
          });
        } else {
          uniqueCombinations.add(uniqueKey);
        }
      })
    );

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Error occurred while creating Ratelist",
        errors,
      });
    }

    await CreateUser.save();
    const newRateList = new ratelist({
      managerID,
      branchID: BranchId,
      userID: CreateUser._id,
      rateList,
    });
    await newRateList.save();

    res.status(200).json({ message: "User Created Successfully!" });
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
    const { email, name, password, rateList, phone } = req.body;
    const { branchID, userID } = req.params;

    const findBranch = await BranchSchema.findById(branchID);
    const findUser = await UserSchema.findById(userID);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }
    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    const existingUser =
      (await AdminSchema.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: userID },
      })) ||
      (await RiderSchema.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: userID },
      })) ||
      (await SuperAdmin.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: userID },
      })) ||
      (await ManagerSchema.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: userID },
      })) ||
      (await UserSchema.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: userID },
      }));

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or Phone Already Exists!" });
    }

    if (!Array.isArray(rateList)) {
      return res.status(400).json({ message: "Invalid RateList Format" });
    }

    const errors = [];
    const uniqueCombinations = new Set();

    await Promise.all(
      rateList.map(async (priceList) => {
        const findExisting = await ratelist.findOne({
          "rateList.countryName": priceList.countryName,
          "rateList.city": priceList.city,
          "rateList.state": priceList.state,
          "rateList.zipCodeRangeStart": priceList.zipCodeRangeStart,
          "rateList.zipCodeRangeEnd": priceList.zipCodeRangeEnd,
          "rateList.shipmentType": { $in: priceList.shipmentType },
          "rateList.shipmentCategory": { $in: priceList.shipmentCategory },
        });

        if (findExisting) {
          const duplicateInfo = {
            countryName: priceList.countryName,
            city: priceList.city,
            state: priceList.state,
            zipCodeRangeStart: priceList.zipCodeRangeStart,
            zipCodeRangeEnd: priceList.zipCodeRangeEnd,
            shipmentType: priceList.shipmentType.join(", "),
            shipmentCategory: priceList.shipmentCategory.join(", "),
          };

          errors.push({
            ...duplicateInfo,
            message: "Duplicate Entry Exists for this RateList.",
          });
        }

        if (priceList?.rates === 0) {
          errors.push({ ...priceList, message: "Rates can't be zero" });
        }

        if (Number(priceList?.weight) === 0) {
          errors.push({ ...priceList, message: "Weights can't be zero" });
        }

        const uniqueKey = `${priceList.countryName}-${priceList.city} / ${
          priceList.state
        }-${priceList.zipCodeRangeStart}-${
          priceList.zipCodeRangeEnd
        }-${priceList.shipmentType.join(
          ", "
        )}-${priceList.shipmentCategory.join(", ")}`;

        if (uniqueCombinations.has(uniqueKey)) {
          errors.push({
            ...priceList,
            message: "Duplicate city with the same shipment type and category",
          });
        } else {
          uniqueCombinations.add(uniqueKey);
        }
      })
    );

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Error occurred while updating Ratelist",
        errors,
      });
    }

    findUser.email = email || findUser.email;
    findUser.name = name || findUser.name;
    findUser.password = password || findUser.password;
    findUser.phone = phone || findUser.phone;

    const currentRateList = await ratelist.findOne({ userID: userID });

    if (currentRateList) {
      const updatedRateList = [...currentRateList.rateList];

      rateList.forEach((newRate) => {
        const existingRateIndex = updatedRateList.findIndex(
          (existingRate) =>
            existingRate.countryName === newRate.countryName &&
            existingRate.state === newRate.state &&
            existingRate.city === newRate.city &&
            existingRate.zipCodeRangeEnd === newRate.zipCodeRangeEnd &&
            existingRate.shipmentType.toString() ===
              newRate.shipmentType.toString() &&
            existingRate.shipmentCategory.toString() ===
              newRate.shipmentCategory.toString()
        );

        if (existingRateIndex === -1) {
          updatedRateList.push(newRate);
        } else {
          updatedRateList[existingRateIndex] = {
            ...updatedRateList[existingRateIndex],
            ...newRate,
          };
        }
      });

      await ratelist.findOneAndUpdate(
        { userID: userID },
        { rateList: updatedRateList },
        { new: true }
      );
    } else {
      return res.status(400).json({
        message: "RateList does not exist for this user. Unable to update.",
      });
    }

    await findUser.save();

    const userResponse = {
      email: findUser.email,
      name: findUser.name,
      phone: findUser.phone,
      branch: findBranch.name,
    };

    res.status(200).json({
      message: "User and Ratelist Updated Successfully!",
      user: userResponse,
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

      if (!Array.isArray(req?.body?.rateList)) {
        return res.status(400).json({ message: "Ratelist format is invalid" });
      }

      const existingRateList = await ratelist.findOne({ userID: id });
      if (!existingRateList) {
        return res.status(404).json({ message: "Rate List not found!" });
      }

      const dataArray = [];
      const invalidDataArray = [];

      req.body.rateList.map(async (item) => {
        const hasAllRequiredFields =
          item.countryName &&
          item.city &&
          item.state &&
          item.zipCodeRangeStart &&
          item.zipCodeRangeEnd &&
          item.shipmentType &&
          item.rates &&
          item.weight &&
          item.shipmentCategory &&
          ["SpeedyShip", "SteadyShip", "Postal Economy", "CustomShip"].includes(
            item.shipmentType
          ) &&
          ["Collection", "Mid-Mile", "Customs Clearance", "Delivery"].includes(
            item.shipmentCategory
          );
        if (hasAllRequiredFields) {
          const existingEntry = await ratelist.findOne({
            "rateList.countryName": item.countryName,
            "rateList.state": item.state,
            "rateList.city": item.city,
            "rateList.shipmentType": item.shipmentType,
            "rateList.shipmentCategory": item.shipmentCategory,
          });

          if (existingEntry) {
            // Add to invalidDataArray if a duplicate is found
            invalidDataArray.push({
              ...item,
              errors: [{ message: "Duplicate entry for this RateList." }],
            });
          } else {
            const modifiedData = {
              _id: new mongoose.Types.ObjectId(),
              countryName: String(item.countryName),
              city: String(item.city),
              state: String(item.state),
              zipCodeRangeStart: String(item.zipCodeRangeStart),
              zipCodeRangeEnd: String(item.zipCodeRangeEnd),
              shipmentType: String(item.shipmentType),
              rates: Number(item.rates),
              weight: Number(item.weight),
              shipmentCategory: String(item.shipmentCategory),
            };
            dataArray.push(modifiedData);
          }
        } else {
          // Handle missing fields or invalid data
          invalidDataArray.push({
            ...item,
            errors: [
              {
                message: !item.countryName
                  ? "countryName field is required"
                  : null,
              },
              { message: !item.city ? "city field is required" : null },
              { message: !item.state ? "state field is required" : null },
              {
                message: !item.zipCodeRangeStart
                  ? "zipCodeRangeStart field is required"
                  : null,
              },
              {
                message: !item.zipCodeRangeEnd
                  ? "zipCodeRangeEnd field is required"
                  : null,
              },
              {
                message: !item.shipmentType
                  ? "shipmentType field is required"
                  : ![
                      "SpeedyShip",
                      "SteadyShip",
                      "Postal Economy",
                      "CustomShip",
                    ].includes(item.shipmentType)
                  ? "Invalid Shipment Type"
                  : null,
              },
              {
                message: !item.shipmentCategory
                  ? "shipmentCategory field is required"
                  : ![
                      "Collection",
                      "Mid-Mile",
                      "Customs Clearance",
                      "Delivery",
                    ].includes(item.shipmentCategory)
                  ? "Invalid shipmentCategory"
                  : null,
              },
            ],
          });
        }
      });

      if (invalidDataArray.length > 0) {
        return res
          .status(200)
          .json({ invalidData: invalidDataArray, validData: dataArray });
      }

      const findRateList = await ratelist.findOne({ userID: findUser._id });
      console.log(findRateList, "===================1");

      const test = await ratelist.findOneAndUpdate(
        { userID: findUser._id },
        {
          $set: { rateList: [...findRateList.toObject(), dataArray] },
        }
      );

      console.log(test, "===================2");

      const profileImage = req?.files?.profileImage;
      const uploadResult = profileImage
        ? await cloudinary.uploader.upload(profileImage.tempFilePath, {
            resource_type: "image",
            folder: "profile",
          })
        : "";
      findUser.profileImage = uploadResult.secure_url || findUser.profileImage;

      await findUser.save();

      return res.status(200).json({
        message: "Profile Updated Successfully!",
        user: findUser,
        invalidData: invalidDataArray,
        validData: dataArray,
      });
    } else {
      return res.status(400).json({ message: "Bad Request" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

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
          rowData.countryName &&
          rowData.city &&
          rowData.state &&
          rowData.zipCodeRangeStart &&
          rowData.zipCodeRangeEnd &&
          rowData.shipmentType &&
          rowData.rates &&
          rowData.weight &&
          rowData.shipmentCategory &&
          ["SpeedyShip", "SteadyShip", "Postal Economy", "CustomShip"].includes(
            rowData.shipmentType
          ) &&
          ["Collection", "Mid-Mile", "Customs Clearance", "Delivery"].includes(
            rowData.shipmentCategory
          );

        if (hasAllRequiredFields) {
          // Check for duplicate entry in the database
          const existingEntry = await ratelist.findOne({
            "rateList.countryName": rowData.countryName,
            "rateList.state": rowData.state,
            "rateList.city": rowData.city,
            "rateList.shipmentType": rowData.shipmentType,
            "rateList.shipmentCategory": rowData.shipmentCategory,
          });

          if (existingEntry) {
            // Add to invalidDataArray if a duplicate is found
            invalidDataArray.push({
              rowData,
              errors: [{ message: "Duplicate entry for this RateList." }],
            });
          } else {
            const modifiedData = {
              _id: new mongoose.Types.ObjectId(),
              countryName: String(rowData.countryName),
              city: String(rowData.city),
              state: String(rowData.state),
              zipCodeRangeStart: String(rowData.zipCodeRangeStart),
              zipCodeRangeEnd: String(rowData.zipCodeRangeEnd),
              shipmentType: String(rowData.shipmentType),
              rates: Number(rowData.rates),
              weight: Number(rowData.weight),
              shipmentCategory: String(rowData.shipmentCategory),
            };
            dataArray.push(modifiedData);
          }
        } else {
          // Handle missing fields or invalid data
          invalidDataArray.push({
            rowData,
            errors: [
              {
                message: !rowData.countryName
                  ? "countryName field is required"
                  : null,
              },
              { message: !rowData.city ? "city field is required" : null },
              { message: !rowData.state ? "state field is required" : null },
              {
                message: !rowData.zipCodeRangeStart
                  ? "zipCodeRangeStart field is required"
                  : null,
              },
              {
                message: !rowData.zipCodeRangeEnd
                  ? "zipCodeRangeEnd field is required"
                  : null,
              },
              {
                message: !rowData.shipmentType
                  ? "shipmentType field is required"
                  : ![
                      "SpeedyShip",
                      "SteadyShip",
                      "Postal Economy",
                      "CustomShip",
                    ].includes(rowData.shipmentType)
                  ? "Invalid Shipment Type"
                  : null,
              },
              {
                message: !rowData.shipmentCategory
                  ? "shipmentCategory field is required"
                  : ![
                      "Collection",
                      "Mid-Mile",
                      "Customs Clearance",
                      "Delivery",
                    ].includes(rowData.shipmentCategory)
                  ? "Invalid shipmentCategory"
                  : null,
              },
            ],
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
    const { branchID } = req.params;

    const file = req.files?.file;
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
          rowData.countryName &&
          rowData.city &&
          rowData.state &&
          rowData.zipCodeRangeStart &&
          rowData.zipCodeRangeEnd &&
          rowData.shipmentType &&
          rowData.rates &&
          rowData.weight &&
          rowData.shipmentCategory &&
          ["SpeedyShip", "SteadyShip", "Postal Economy", "CustomShip"].includes(
            rowData.shipmentType
          ) &&
          ["Collection", "Mid-Mile", "Customs Clearance", "Delivery"].includes(
            rowData.shipmentCategory
          );

        if (hasAllRequiredFields) {
          const modifiedData = {
            _id: new mongoose.Types.ObjectId(),
            countryName: String(rowData.countryName),
            city: String(rowData.city),
            state: String(rowData.state),
            zipCodeRangeStart: String(rowData.zipCodeRangeStart),
            zipCodeRangeEnd: String(rowData.zipCodeRangeEnd),
            shipmentType: String(rowData.shipmentType),
            rates: Number(rowData.rates),
            weight: Number(rowData.weight),
            shipmentCategory: String(rowData.shipmentCategory),
          };
          dataArray.push(modifiedData);
        } else {
          // Handle missing fields or invalid data
          invalidDataArray.push({
            rowData,
            errors: [
              {
                message: !rowData.countryName
                  ? "countryName field is required"
                  : null,
              },
              { message: !rowData.city ? "city field is required" : null },
              { message: !rowData.state ? "state field is required" : null },
              {
                message: !rowData.zipCodeRangeStart
                  ? "zipCodeRangeStart field is required"
                  : null,
              },
              {
                message: !rowData.zipCodeRangeEnd
                  ? "zipCodeRangeEnd field is required"
                  : null,
              },
              {
                message: !rowData.shipmentType
                  ? "shipmentType field is required"
                  : ![
                      "SpeedyShip",
                      "SteadyShip",
                      "Postal Economy",
                      "CustomShip",
                    ].includes(rowData.shipmentType)
                  ? "Invalid Shipment Type"
                  : null,
              },
              {
                message: !rowData.shipmentCategory
                  ? "shipmentCategory field is required"
                  : ![
                      "Collection",
                      "Mid-Mile",
                      "Customs Clearance",
                      "Delivery",
                    ].includes(rowData.shipmentCategory)
                  ? "Invalid shipmentCategory"
                  : null,
              },
            ],
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
