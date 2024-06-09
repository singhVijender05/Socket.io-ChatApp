import { Router } from "express";
import upload from "../middlewares/multer.mw.js";
import {registerUser,loginUser,logoutUser,refreshAccessToken,updateAvatar,changeCurrentUserPassword,findCurrentUser,updateDetails} from "../controllers/user.controllers.js";
const router = Router();

router.post("/signup",upload.single("pic"),registerUser);
router.post("/login",loginUser);
 

export {router};