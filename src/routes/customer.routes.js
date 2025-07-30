const express = require("express");
const CustomerController = require("../controller/customer.controller");
const auth = require("../middleware/auth");
const api = express.Router();
const { checkSchema } = require("express-validator");
import validate from "../middleware/validation";
const multer = require("multer");
import fs from "fs";

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

api.post("/login", CustomerController.logInCustomer);
api.post("/sign-up", CustomerController.CustomerSignUp);

module.exports = api;
