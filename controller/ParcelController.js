import BranchSchema from "../models/BranchSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import parcelSchema from "../models/parcelSchema.js";
import ratelist from "../models/ratelist.js";
import UserSchema from "../models/UserSchema.js";

import { v2 as cloudinary } from "cloudinary";

import fs from "fs";
import csv from "fast-csv";
import { Readable } from "stream";
import mongoose from "mongoose";
import RidersGroupSchema from "../models/RidersGroupSchema.js";
import RiderSchema from "../models/RiderSchema.js";
import Assignment from "../models/Assignment.js";
import AdminSchema from "../models/AdminSchema.js";
import SuperAdmin from "../models/SuperAdmin.js";
import autoMailer from "../utils/AutoMailer.js";
import generateUniqueOrderNumber from "../utils/RandomNumGenerator.js";

const CreateParcel = async (req, res) => {
  try {
    const { userId, BranchId, rateListID } = req.params;
    const {
      parcelDescription,
      CodAmount,
      weight,
      dangerousGoods,
      CodCharges,
      Dimension,
      receiverName,
      description,
      recieverPhone,
      recieverEmail,
      reciverAddress,
      ReciverPostCode,
      SenderPhone,
      SenderAddress,
      SenderPostCode,
      haveOwnTrackID,
      ownTrackID,
      hsCode,
    } = req.body;

    const findUser = await UserSchema.findById(userId);
    const findBranch = await BranchSchema.findById(BranchId);

    const findManager = await ManagerSchema.findOne({
      branchID: findBranch._id,
    });

    let findRateList = await ratelist.findOne({ "rateList._id": rateListID });

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }
    if (!findRateList) {
      return res.status(404).json({ message: "Rate List Not Found!" });
    }

    if (!findBranch) {
      return res.status(404).json({ message: "Branch Not Found!" });
    }

    if (hsCode && hsCode.length !== 7) {
      return res
        .status(404)
        .json({ message: "Hs Code Should Be 6 Digits Only" });
    }

    if (haveOwnTrackID === true && ownTrackID === "") {
      return res.status(400).json({
        message: "Please Enter Track ID or Unselect the haveOwnTrackID Option",
      });
    }
    if (haveOwnTrackID === true && ownTrackID.length !== 14) {
      return res.status(400).json({
        message: "Track ID must be 14 char long",
      });
    }

    const validateTrackID = await parcelSchema.findOne({
      ownTrackID: ownTrackID,
    });

    if (validateTrackID) {
      return res.status(400).json({
        message: "Track ID must be unique",
      });
    }

    const volumetricWeight =
      (Number(Dimension?.width) *
        Number(Dimension?.height) *
        Number(Dimension?.length)) /
      5000;

    const filteredRateList = findRateList
      ? findRateList.rateList.filter(
          (rate) => rate._id.toString() === rateListID.toString()
        )
      : [];

    let netWeight;

    if (Number(weight) < volumetricWeight) {
      findRateList = await ratelist.findOne({
        "rateList.weight": volumetricWeight,
        "rateList.shipmentType": filteredRateList[0].shipmentType,
        "rateList.shipmentCategory": filteredRateList[0].shipmentCategory,
        "rateList.countryName": filteredRateList[0].countryName,
        "rateList.state": filteredRateList[0].state,
        "rateList.city": filteredRateList[0].city,
      });

      if (!findRateList) {
        findRateList = await ratelist
          .findOne({
            "rateList.shipmentType": filteredRateList[0].shipmentType,
            "rateList.shipmentCategory": filteredRateList[0].shipmentCategory,
            "rateList.countryName": filteredRateList[0].countryName,
            "rateList.state": filteredRateList[0].state,
            "rateList.city": filteredRateList[0].city,
            "rateList.weight": { $gte: volumetricWeight },
          })
          .sort({ "rateList.weight": 1 });
      }

      if (!findRateList) {
        return res.status(400).json({
          message: "No rate found close to the volumetric weight.",
        });
      }

      netWeight = volumetricWeight;
    } else {
      netWeight = Number(weight);
    }

    const extractId = findRateList.rateList.find(
      (rate) =>
        rate.shipmentType === filteredRateList[0].shipmentType &&
        rate.shipmentCategory === filteredRateList[0].shipmentCategory &&
        rate.countryName === filteredRateList[0].countryName &&
        rate.state === filteredRateList[0].state &&
        rate.city === filteredRateList[0].city &&
        rate.weight >= volumetricWeight
    );

    console.log(extractId);

    if (!netWeight || netWeight === undefined || netWeight === 0) {
      return res.status(400).json({
        message: "Invalid Weight value",
      });
    }

    if (
      Dimension.weight === 0 ||
      Dimension.length === undefined ||
      Dimension.length === 0 ||
      Dimension.width === undefined ||
      Dimension.width === 0 ||
      Dimension.height === 0 ||
      Dimension.height === undefined
    ) {
      return res.status(400).json({
        message: "Invalid Dimensions Provided",
      });
    }

    const createParcel = new parcelSchema({
      userId,
      branchID: BranchId,
      rateListID: extractId._id,
      parcelDescription,
      CodAmount,
      weight: netWeight,
      dangerousGoods: dangerousGoods === "yes" ? true : false,
      Dimension: Dimension || {},
      recieverPhone,
      hsCode,
      recieverEmail,
      reciverAddress,
      ReciverPostCode,
      SenderPhone,
      SenderAddress,
      SenderPostCode,
      haveOwnTrackID,
      ownTrackID: haveOwnTrackID === true ? ownTrackID?.toString() : "",
      CodCharges,
      receiverName,
      description,
    });

    await createParcel.save();

    const extractAdminIds = findBranch.AdminsId.map((id) => id);
    const mapped = extractAdminIds.map(async (id) => {
      const findAdmin = await AdminSchema.findById(id);
      return autoMailer({
        from: "admin@tactix.asia",
        to: findAdmin.email,
        subject: "Welcome to our platform, TACTIX",
        message: `
        <h3 style="font-family: Arial, sans-serif; color: #34495e;">
          New Parcel Arrived <strong>${findManager.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
        </h3>
        <br/>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
          For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
        </p>`,
      });
    });

    await Promise.all(mapped);

    autoMailer({
      from: "admin@tactix.asia",
      to: findManager.email,
      subject: "Welcome to our platform, TACTIX",
      message: `
      <h3 style="font-family: Arial, sans-serif; color: #34495e;">
        New Parcel Arrived <strong>${findManager.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
      </h3>
      <br/>
      <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
        For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
      </p>`,
    });

    autoMailer({
      from: "admin@tactix.asia",
      to: `${findUser.email}`,
      subject: "Welcome to our platform, TACTIX",
      message: `
        <h3 style="font-family: Arial, sans-serif; color: #34495e;">
          Your Parcel Has Been Placed Succssfully <strong>${findManager.name}</strong> and is linked to the branch: <strong>${findBranch.branch_name}</strong>
        </h3>
        <br/>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
          For any queries, please contact the branch at: <strong>${findBranch.branch_contact_number}</strong>
        </p>`,
    });

    return res.status(201).json({
      message: "Parcel Created Successfully!",
      parcel: createParcel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getParcelOfUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const findUser = await UserSchema.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User not found!" });
    } else {
      const findUserParcel = await parcelSchema
        .find({ userId: userId })
        .populate({
          path: "userId",
          model: "users",
          select: "-password",
        });
      const assignment = findUserParcel.map(async (item) => {
        const findAssignment = await Assignment.findOne({
          parcelID: item._id,
        }).populate({
          path: "customerID",
          model: "users",
          select: "_id name email phone",
        });

        const findRateList = await ratelist.findOne({
          "rateList._id": item.rateListID,
        });

        const filteredRateList = findRateList
          ? findRateList.rateList.filter(
              (rate) => rate._id.toString() === item.rateListID.toString()
            )
          : [];

        return {
          ...item.toObject(),
          assignment: findAssignment ? findAssignment : null,
          rateList: filteredRateList[0] || null,
        };
      });
      const resolved = await Promise.all(assignment);
      return res
        .status(200)
        .json({ message: "User Parcel", findUserParcel: resolved });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};


const HandleBulkUpload = async (req, res) => {
  try {
    const { userId, branchID } = req.params;
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
          rowData.parcelDescription &&
          rowData.CodAmount &&
          rowData.weight &&
          rowData.recieverPhone &&
          rowData.reciverAddress &&
          rowData.description &&
          rowData.receiverName &&
          rowData.ReciverPostCode &&
          rowData.SenderPhone &&
          rowData.SenderAddress &&
          rowData.SenderPostCode &&
          rowData.dangerousGoods &&
          rowData.height &&
          rowData.width &&
          rowData.length &&
          rowData.recieverEmail &&
          rowData.CodCharges &&
          (rowData.CodAmount === "yes"
            ? rowData.CodCharges !== "null" && rowData.CodCharges !== "0"
            : rowData.CodAmount === "no" && rowData.CodCharges === "null") &&
          (rowData.dangerousGoods === "yes" ||
            rowData.dangerousGoods === "no") &&
          (!rowData.hsCode || (rowData.hsCode && rowData.hsCode.length === 7));

        if (hasAllRequiredFields) {
          const modifiedData = {
            _id: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(userId),
            branchID: new mongoose.Types.ObjectId(branchID),
            parcelDescription: String(rowData.parcelDescription),
            CodAmount: Boolean(rowData.CodAmount === "yes" ? true : false),
            weight: Number(rowData.weight),
            dangerousGoods: Boolean(
              rowData.dangerousGoods === "yes" ? true : false
            ),
            Dimension: {
              height: Number(rowData.height),
              width: Number(rowData.width),
              length: Number(rowData.length),
            },
            CodCharges:
              rowData.CodAmount === "yes" ? Number(rowData.CodCharges) : null,
            recieverPhone: String(rowData.recieverPhone),
            receiverName: String(rowData.receiverName),
            description: String(rowData.description),
            recieverEmail: String(rowData.recieverEmail),
            reciverAddress: String(rowData.reciverAddress),
            ReciverPostCode: Number(rowData.ReciverPostCode),
            SenderPhone: String(rowData.SenderPhone),
            SenderAddress: String(rowData.SenderAddress),
            SenderPostCode: Number(rowData.SenderPostCode),
            hsCode: Number(rowData.hsCode),
            haveOwnTrackID: Boolean(
              rowData.haveOwnTrackID === "yes" ? true : false
            ),
            ownTrackID:
              rowData.haveOwnTrackID === "yes" &&
              (rowData.ownTrackID !== "" || rowData.ownTrackID.length !== 14)
                ? rowData.ownTrackID
                : "",
          };
          dataArray.push(modifiedData);
        } else {
          // Push invalid data to invalidDataArray for reporting

          invalidDataArray.push(
            {
              ...rowData,
              message: !rowData.parcelDescription
                ? "parcelDescription field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.CodAmount
                ? "CodAmount field is required"
                : null,
            },
            {
              ...rowData,
              message:
                rowData.CodAmount === "yes" &&
                (rowData.CodCharges === "null" || rowData.CodCharges === "0")
                  ? "CodCharges cannot be 'null' or 0 if CodAmount is 'yes'"
                  : rowData.CodAmount === "no" && rowData.CodCharges !== "null"
                  ? "CodCharges should be 'null' if CodAmount is 'no'"
                  : null,
            },
            {
              ...rowData,

              message: !rowData.weight ? "weight field is required" : null,
            },
            {
              ...rowData,

              message: !rowData.height ? "height field is required" : null,
            },
            {
              ...rowData,

              message: !rowData.length ? "length field is required" : null,
            },
            {
              ...rowData,

              message: !rowData.recieverPhone
                ? "recieverPhone field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.receiverName
                ? "receiverName field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.reciverAddress
                ? "reciverAddress field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.ReciverPostCode
                ? "ReciverPostCode field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.SenderPhone
                ? "SenderPhone field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.SenderAddress
                ? "SenderAddress field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.SenderAddress
                ? "SenderAddress field is required"
                : null,
            },
            {
              ...rowData,

              message: !rowData.SenderPostCode
                ? "SenderPostCode field is required"
                : null,
            },
          
            {
              ...rowData,

              message:
                rowData.haveOwnTrackID === "yes" &&
                (rowData.ownTrackID === "null" ||
                  rowData.ownTrackID.length !== 14)
                  ? "ownTrackID cannot be null or less than 14 digits"
                  : null,
            },
            {
              ...rowData,

              message: !rowData.CodCharges
                ? "CodCharges field is required"
                : null,
            },
            {
              ...rowData,

              message:
                rowData.hsCode && rowData.hsCode.length !== 7
                  ? "hsCode should be 7 digits long"
                  : null,
            },
            {
              ...rowData,

              message:
                !rowData.dangerousGoods ||
                (rowData.dangerousGoods !== "yes" &&
                  rowData.dangerousGoods !== "no")
                  ? 'dangerousGoods must be "yes" or "no"'
                  : null,
            }
          );
        }
      })
      .on("end", async function () {
        const findRateList = await ratelist.findOne({ userID: userId });
        res.status(200).json({
          message: "Upload processed",
          validData: dataArray,
          invalidData:
            invalidDataArray.length > 0
              ? invalidDataArray.filter((item) => item.message !== null)
              : null,
          rateList: findRateList,
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleBulkParcelCreate = async (req, res) => {
  try {
    const { userId, branchID } = req.params;
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(404).json({ message: "Invalid Format" });
    }
    const errors = [];
    await Promise.all(
      data.map(async (item) => {
        if (item.ownTrackID && item.ownTrackID.trim() !== "") {
          if (item.ownTrackID.trim().length !== 14) {
            errors.push({
              ...item,
              message: "Track ID must be 14 characters long",
            });
          } else {
            const validateTrackID = await parcelSchema.findOne({
              ownTrackID: item.ownTrackID,
            });
            if (validateTrackID) {
              errors.push({ ...item, message: "Track ID Already Exists" });
            }
          }
        }
      })
    );
    await Promise.all(
      data.map(async (item) => {
        if (
          Number(item.weight) === 0 ||
          Number(item.length) === undefined ||
          Number(item.length) === 0 ||
          Number(item.width) === undefined ||
          Number(item.width) === 0 ||
          Number(item.height) === 0 ||
          Number(item.height) === undefined
        ) {
          errors.push({ ...item, message: "Invalid Weight or Dimensions" });
        }
      })
    );
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Error Creating Parcels",
        errors,
      });
    }
    const createParcelPromises = data.map(async (item) => {
      let netWeight;
      const volumetricWeight =
        (item.Dimension.height * item.Dimension.width * item.Dimension.length) /
        5000;
      if (item.weight < volumetricWeight) {
        return (netWeight = volumetricWeight);
      } else {
        netWeight = volumetricWeight;
      }
      const createParcels = new parcelSchema({
        userId: new mongoose.Types.ObjectId(userId),
        branchID: new mongoose.Types.ObjectId(branchID),
        rateListID: new mongoose.Types.ObjectId(item.rateListID),
        parcelDescription: item.parcelDescription,
        CodAmount: item.CodAmount,
        CodCharges:
          item.CodCharges === "null" || item.CodCharges === ""
            ? null
            : Number(item.CodCharges),
        weight: netWeight,
        dangerousGoods: item.dangerousGoods === "yes",
        Dimension: {
          height: item.Dimension.height,
          width: item.Dimension.width,
          length: item.Dimension.length,
        },
        recieverPhone: item.recieverPhone,
        receiverName: item.receiverName,
        description: item.description,
        recieverEmail: item.recieverEmail,
        reciverAddress: item.reciverAddress,
        ReciverPostCode: item.ReciverPostCode,
        SenderPhone: item.SenderPhone,
        SenderAddress: item.SenderAddress,
        hsCode: item.hsCode,
        SenderPostCode: item.SenderPostCode,
        haveOwnTrackID: item.haveOwnTrackID,
        ownTrackID: item.haveOwnTrackID ? String(item.ownTrackID) : "",
      });
      await createParcels.save();
      return createParcels;
    });
    const createdParcels = await Promise.all(createParcelPromises);
    res.status(200).json({
      message: "Parcels Created Successfully",
      createdParcels,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleAssignParcels = async (req, res) => {
  try {
    const { branchID, riderGroupID } = req.params;
    const { assignedFromManager, customerID, parcelID } = req.body;
    const findBranch = await BranchSchema.findById(branchID);
    if (!findBranch) {
      return res.status(404).json({ message: "Branch not found!" });
    }
    const findRiderGroup = await RidersGroupSchema.findById(riderGroupID);
    if (!findRiderGroup) {
      return res.status(404).json({ message: "Driver Crew not found!" });
    }
    const findDrivers = await RiderSchema.find({
      RiderGroup: findRiderGroup._id,
    });
    if (findDrivers.length === 0) {
      return res.status(400).json({ message: "No drivers available!" });
    }
    const findManager = await ManagerSchema.findById(assignedFromManager);
    if (!findManager) {
      return res.status(404).json({ message: "Manager not found!" });
    }
    const findUser = await UserSchema.findById(customerID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    const findParcel = await parcelSchema.findById(parcelID);
    const findRateList = await ratelist.findOne({
      "rateList._id": findParcel.rateListID,
    });
    const filteredRateList = findRateList.rateList.filter(
      (rateID) => rateID._id.toString() === findParcel.rateListID.toString()
    );
    const data = {
      ...findParcel.toObject(),
      rateList: !findParcel.CodAmount
        ? Number(filteredRateList[0].rates * findParcel.weight)
        : Number(
            filteredRateList[0].rates * findParcel.weight +
              findParcel.CodCharges
          ),
    };
    if (!findParcel) {
      return res.status(404).json({ message: "Parcel not found!" });
    }
    const createAssignment = new Assignment({
      branchID,
      riderGroupID,
      customerID,
      assignedFromManager,
      parcelID,
      totalPrice: data.rateList,
    });
    await createAssignment.save();
    await parcelSchema.findByIdAndUpdate(
      parcelID,
      { $set: { status: "Order Received" } },
      { new: true }
    );
    autoMailer({
      from: "admin@tactix.asia",
      to: `${findUser.email}`,
      subject: "Welcome to our platform, TACTIX",
      message: `
        <h3 style="font-family: Arial, sans-serif; color: #34495e;">
          Your Order Has Been Received Successfully <strong>${
            findManager.name
          }</strong> and is linked to the branch: <strong>${
        findBranch.branch_name
      }</strong>
        </h3>
        <h4> Now You Can Start Tracking Your Order With This ID On Our HOme Page ${
          findParcel.haveOwnTrackID ? findParcel.ownTrackID : findParcel._id
        }</h4>
        <br/>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #7f8c8d;">
          For any queries, please contact the branch at: <strong>${
            findBranch.branch_contact_number
          }</strong>
        </p>`,
    });
    res.status(200).json({
      message: `Parcel Has Been Assigned To : ${findRiderGroup.groupname} By The Manager ${findManager.name}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetParcels = async (req, res) => {
  try {
    const { id } = req.params;
    const findUser =
      (await ManagerSchema.findById(id)) ||
      (await AdminSchema.findById(id)) ||
      (await UserSchema.findById(id)) ||
      (await SuperAdmin.findById(id));
    if (!findUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (findUser.role.includes("Manager")) {
      const findManager = await ManagerSchema.findOne({ _id: id });
      if (!findManager) {
        return res.status(404).json({ message: "Manager Not Found" });
      }
      const findBranch = await BranchSchema.findOne({
        _id: findManager.branchID,
      });
      if (!findBranch) {
        return res.status(404).json({ message: "Branch Not Found" });
      }
      const findParcels = await parcelSchema
        .find({ branchID: findBranch._id })
        .populate({
          path: "userId",
          model: "users",
          select: "-password",
        });
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
          path: "customerID",
          model: "users",
          select: "_id name email phone",
        });
        return {
          ...item.toObject(),
          rateList: filteredRateList[0] || null,
          assignment: findAssignment,
        };
      });
      const resolved = await Promise.all(includeRatelist);
      return res.status(200).json({ parcels: resolved });
    } else if (findUser.role.includes("SuperAdmin")) {
      const findParcels = await parcelSchema.find().populate({
        path: "userId",
        model: "users",
        select: "-password",
      });
      const includeRatelist = findParcels.map(async (item) => {
        const findRateList = await ratelist.findOne({
          "rateList._id": item.rateListID,
        });
        const filteredRateList = findRateList.rateList.filter(
          (rateID) => rateID._id.toString() === item.rateListID.toString()
        );
        const findAssignment = await Assignment.findOne({ parcelID: item._id })
          .populate({
            path: "parcelID",
            model: "parcel",
            select:
              "Status status _id ownTrackID parcelDescription rateListID reciverAddress SenderAddress CodCharges CodAmount haveOwnTrackID weight",
          })
          .populate({
            path: "customerID",
            model: "users",
            select: "",
          });
        return {
          ...item.toObject(),
          rateList: filteredRateList[0],
          assignment: findAssignment,
        };
      });
      const resolved = await Promise.all(includeRatelist);
      console.log(resolved);
      return res.status(200).json({ parcels: resolved });
    } else if (findUser.role.includes("Admin")) {
      const findBranch = await BranchSchema.find({ AdminsId: { $in: id } });
      if (!findBranch || findBranch.length === 0) {
        return res.status(404).json({ message: "Branch Not Found" });
      }
      const branchIDs = findBranch.map((branch) => branch._id);
      const findParcels = await parcelSchema
        .find({
          branchID: { $in: branchIDs },
        })
        .populate({
          path: "userId",
          model: "users",
          select: "-password",
        });
      const includeRatelist = findParcels.map(async (item) => {
        const findRateList = await ratelist.findOne({
          "rateList._id": item.rateListID,
        });
        const filteredRateList = findRateList
          ? findRateList.rateList.filter(
              (rateID) => rateID._id.toString() === item.rateListID.toString()
            )
          : [];
        const findAssignment = await Assignment.findOne({ parcelID: item._id });
        return {
          ...item.toObject(),
          rateList: filteredRateList[0] || null,
          assignment: findAssignment || null,
        };
      });
      const resolved = await Promise.all(includeRatelist);
      return res.status(200).json({ parcels: resolved });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetSingleParcels = async (req, res) => {
  try {
    const { parcelID } = req.params;
    const findParcel = await parcelSchema.findById(parcelID);
    const findAssignment = await Assignment.findOne({ parcelID: parcelID })
      .populate({
        path: "parcelID",
        model: "parcel",
        select:
          "Status _id ownTrackID parcelDescription rateListID reciverAddress SenderAddress hsCode",
      })
      .populate({
        path: "customerID",
        model: "users",
        select: "_id name email phone",
      });
    if (!findParcel) {
      return res.status(404).json({ message: "Parcel not found!" });
    }
    const findRateList = await ratelist.findOne({
      "rateList._id": findParcel.rateListID,
    });
    const filteredRateList = findRateList.rateList.filter(
      (rateID) => rateID._id.toString() === findParcel.rateListID.toString()
    );
    return res.status(200).json({
      parcel: {
        ...findParcel.toObject(),
        assignment: findAssignment,
        ratelist: filteredRateList,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleTrackParcel = async (req, res) => {
  try {
    const { userID, trackID } = req.params;
    const findParcel = await parcelSchema.findOne({
      $or: [{ _id: String(trackID) }, { String: Number(trackID) }],
    });
    const findAssignment = await Assignment.findOne({
      parcelID: findParcel._id,
    })
      .populate({
        path: "branchID",
        model: "branches",
      })
      .populate({
        path: "assignedFromManager",
        model: "managers",
      })
      .populate({
        path: "riderGroupID",
        model: "ridersgroup",
      })
      .populate({
        path: "customerID",
        model: "users",
      })
      .populate({
        path: "riderID",
        model: "riders",
      })
      .populate({
        path: "parcelID",
        model: "parcel",
      });

    return res
      .status(200)
      .json({ assignment: findAssignment, message: "Tracked Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetParcelsByGroupID = async (req, res) => {
  try {
    const { riderGroupID } = req.params;
    const assignments = await Assignment.find({
      riderGroupID: riderGroupID,
      Status: ["Shipment Sorted at Delivery Facility"],
      riderID: null,
    })
      .populate({
        path: "parcelID",
        model: "parcel",
        select:
          "Status status _id parcelDescription rateListID reciverAddress SenderAddress CodCharges CodAmount haveOwnTrackID ownTrackID weight",
      })
      .populate({
        path: "branchID",
        model: "branches",
        select: "branch_name ",
      })
      .populate({
        path: "assignedFromManager",
        model: "managers",
        select: "_id name",
      });
    const mapAssignment = assignments.map(async (item) => {
      const findRateList = await ratelist.findOne({
        "rateList._id": { $in: item.parcelID.rateListID },
      });
      const filteredRateList = findRateList
        ? findRateList.rateList.filter(
            (rate) =>
              rate._id.toString() === item.parcelID.rateListID.toString()
          )
        : [];
      return {
        ...item.parcelID.toObject(),
        rateList: filteredRateList[0] || null,
        assignment: item,
      };
    });
    const resolved = await Promise.all(mapAssignment);
    res.status(200).json({ assignments: resolved });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  CreateParcel,
  getParcelOfUser,
  HandleBulkUpload,
  HandleBulkParcelCreate,
  HandleAssignParcels,
  HandleGetParcels,
  HandleGetSingleParcels,
  HandleTrackParcel,
  HandleGetParcelsByGroupID,
};
