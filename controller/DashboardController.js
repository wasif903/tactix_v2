import mongoose from "mongoose";
import AdminSchema from "../models/AdminSchema.js";
import ManagerSchema from "../models/ManagerSchema.js";
import RiderSchema from "../models/RiderSchema.js";
import SuperAdmin from "../models/SuperAdmin.js";




const HandleDashboardController = async (req, res) => {
    try {
        const { id } = req.params;
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
        const year = new Date().getFullYear();


        const findUser = await SuperAdmin.findById(id)
            || await AdminSchema.findById(id)
            || await ManagerSchema.findById(id)
            || await RiderSchema.findById(id);

        if (!findUser) {
            return res.status(403).json({ message: "Invalid Request" });
        }

        if (findUser.role.includes("SuperAdmin")) {
            const superAdmin = await SuperAdmin.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: "admins",
                        localField: "_id",
                        foreignField: "superAdminID",
                        as: "admins"
                    }
                },
                {
                    $lookup: {
                        from: "branches",
                        localField: "_id",
                        foreignField: "superAdminID",
                        as: "branches"
                    }
                },
                {
                    $lookup: {
                        from: "managers",
                        let: { adminIDs: "$admins._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$adminID", "$$adminIDs"] }
                                }
                            }
                        ],
                        as: "relatedManagers"
                    }
                },
                {
                    $lookup: {
                        from: "riders",
                        let: { managerIDs: "$relatedManagers._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$managerID", "$$managerIDs"] }
                                }
                            }
                        ],
                        as: "relatedRiders"
                    }
                },
                {
                    $lookup: {
                        from: "ridersgroups",
                        let: { managerIDs: "$relatedManagers._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$BranchManagerID", "$$managerIDs"] }
                                }
                            }
                        ],
                        as: "relatedRiderGroups"
                    }
                },
                {
                    $lookup: {
                        from: "parcels",
                        let: { branchIDs: "$branches._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$branchID", "$$branchIDs"] },
                                    status: { $in: ["completed"] },
                                    updatedAt: {
                                        $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days for weekly data
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        day: { $dayOfMonth: "$updatedAt" },
                                        month: { $month: "$updatedAt" },
                                        year: { $year: "$updatedAt" }
                                    },
                                    completedCount: { $sum: 1 }
                                }
                            },
                            {
                                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                            }
                        ],
                        as: "weeklyCompletedParcels"
                    }
                },
                {
                    $lookup: {
                        from: "parcels",
                        let: { branchIDs: "$branches._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$branchID", "$$branchIDs"] },
                                    status: { $in: ["completed"] },
                                }
                            },
                        ],
                        as: "completedParcels"
                    }
                },
                {
                    $lookup: {
                        from: "parcels",
                        let: { branchIDs: "$branches._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$branchID", "$$branchIDs"] },
                                    status: { $in: ["completed"] },
                                    updatedAt: {
                                        $gte: new Date(year, month - 1, 1), // Start of the selected month
                                        $lt: new Date(year, month, 1) // Start of the next month
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: { day: { $dayOfMonth: "$updatedAt" } },
                                    completedCount: { $sum: 1 }
                                }
                            },
                            {
                                $sort: { "_id.day": 1 }
                            }
                        ],
                        as: "monthlyCompletedParcels"
                    }
                },
                {
                    $lookup: {
                        from: "parcels",
                        let: { branchIDs: "$branches._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$branchID", "$$branchIDs"] },
                                    status: { $ne: "completed" }
                                }
                            }
                        ],
                        as: "pendingParcels"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        let: { branchIDs: "$branches._id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$BranchID", "$$branchIDs"] }
                                }
                            }
                        ],
                        as: "totalUsers"
                    }
                },
                {
                    $project: {
                        adminCount: { $size: "$admins" },
                        branchCount: { $size: "$branches" },
                        managerCount: { $size: "$relatedManagers" },
                        riderCount: { $size: "$relatedRiders" },
                        relatedRiderGroups: { $size: "$relatedRiderGroups" },
                        pendingParcels: { $size: "$pendingParcels" },
                        completedParcels: { $size: "$completedParcels" },
                        totalUsers: { $size: "$totalUsers" },
                        weeklyCompletedParcels: 1,
                        monthlyCompletedParcels: 1,
                    }
                }
            ]);



            const formatDataForGraph = (parcelData) => {
                return parcelData.map((entry) => ({
                    name: `Day ${entry._id.day}`,
                    uv: entry.completedCount,
                    pv: entry.completedCount,
                    amt: entry.completedCount
                }));
            };

            const weeklyGraphData = formatDataForGraph(superAdmin[0].weeklyCompletedParcels);
            const monthlyGraphData = formatDataForGraph(superAdmin[0].monthlyCompletedParcels);

            return res.status(200).json({
                message: "Super Admin Aggregation",
                data: {
                    ...superAdmin[0],
                    weeklyGraphData,
                    monthlyGraphData,
                }
            });
        }

        // Additional handling if the user is not a SuperAdmin (optional)
        return res.status(200).json({ message: "User found but no aggregation performed", data: findUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};







export { HandleDashboardController }