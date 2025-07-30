const express = require("express");
const UserController = require("../controller/users.controller");
const auth = require("../middleware/auth");
const api = express.Router();
const { checkSchema } = require("express-validator");
import validate from "../middleware/validation";
const multer = require("multer");
import fs from "fs";
import {
  userValidation,
  userLoginValidation,
  changeStatusValidation,
  otpValidation,
  verifyOtpValidation,
  changePassword,
  forgetPassword,
  userEditValidation,
} from "../validation/users";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(global.config.userPictureUploadPath, { recursive: true });
    return cb(null, global.config.userPictureUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

api.put(
  "/fcm-token",
  auth.ensureAuth("Staff", "Admin", "Customer"),
  UserController.UpdateFcmToken
);


api.post("/login", UserController.logIn);

api.post("/", auth.ensureAuth("Admin"), UserController.createUser);

api.get(
  "/me",
  auth.ensureAuth("Staff", "Admin"),
  UserController.checkUserStatus
);

api.delete("/delete", auth.ensureAuth("Admin"), UserController.bulkDelete);
api.delete("/:id", auth.ensureAuth("Admin"), UserController.deleteUser);
api.get("/", auth.ensureAuth("Admin"), UserController.getUsers);
api.get("/:id", auth.ensureAuth("Admin"), UserController.getUserById);
api.patch(
  "/:id",
  auth.ensureAuth("Admin"),
  [checkSchema(changeStatusValidation), validate],
  UserController.updateUserStatus
);
api.post("/send-otp", UserController.sendOTPFn);
api.put(
  "/:id",
  auth.ensureAuth("Admin","Customer","Staff"),
  upload.single("picture"),
  UserController.updateUser
);

api.post(
  "/verify-otp",
  [checkSchema(verifyOtpValidation), validate],
  UserController.verifyOtp
);

api.post(
  "/change-password",
  auth.ensureAuth("Staff", "Admin", "Customer"),
  UserController.changePassword
);
api.post("/forget-password", UserController.forgetPassword);

module.exports = api;
