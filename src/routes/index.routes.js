const express = require("express");
const api = express.Router();

api.use("/users", require("./users.routes"));
api.use("/customers", require("./customer.routes"));
api.use("/roles", require("./roles.routes"));
module.exports = api;
