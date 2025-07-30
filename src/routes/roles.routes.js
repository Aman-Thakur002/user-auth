const express = require("express");
const api = express.Router();
const auth = require("../middleware/auth");
const roleController = require("../controller/roles.controller");


api.post("/", auth.ensureAuth("Admin", "Staff"), roleController.createRole);
api.get("/", auth.ensureAuth("Staff", "Admin"), roleController.getRoles);
api.get("/:id", auth.ensureAuth("Admin", "Staff"), roleController.getRoleById);
api.put("/:id", auth.ensureAuth("Admin", "Staff"), roleController.updateRole);
api.delete(
  "/delete",
  auth.ensureAuth("Admin", "Staff"),
  roleController.bulkDelete
);
api.delete("/:id", auth.ensureAuth("Admin", "Staff"), roleController.deleteRole);

module.exports = api;
