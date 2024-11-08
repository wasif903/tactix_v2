import express from "express";
import { HandleCreateRateList, HandleDeleteRateById, HandleGetRateList, HandleGetSingleRateList, HandleUpdateRateList } from "../controller/RatelistController.js";



const router = express.Router();

router.post('/:managerID/:branchID/create-ratelist/:userID', HandleCreateRateList)

router.patch('/:managerID/:branchID/update-ratelist/:userID', HandleUpdateRateList)

router.patch('/:managerID/:branchID/delete-ratelist/:userID/:rateListID', HandleDeleteRateById)

router.get('/:managerID/:branchID/get-ratelist/:userID', HandleGetRateList)

router.get('/:managerID/:branchID/get-single-ratelist/:userID/:rateListID', HandleGetSingleRateList)


export default router;





