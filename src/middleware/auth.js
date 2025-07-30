import { decodeToken } from "../utils/jwt";
const { Users, Roles } = require("../models");

export const setModule = (module) => {
  return function (req, res, next) {
    req.module = module ?? null;
    switch (req.method) {
      case "GET":
        req.permission = { module: module ? module + "-Read" : null };
        break;
      case "POST":
      case "PUT":
        req.permission = { module: module ? module + "-Write" : null };
        break;
      case "PATCH":
      case "DELETE":
        req.permission = { module: module ? module + "-All" : null };
        break;
      default:
        req.permission = { module: null };
        break;
    }
    next();
  };
};

//====================================================================================
export const ensureAuth = (...allowedUserTypes) => {
  return async function (req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
    
      // If no token and Guest access is allowed
      if (!authHeader) {
        return next();
      }

      // If no token and Guest access is not allowed
      if (!authHeader && allowedUserTypes.length !== 0) {
        return res.status(403).json({
          status: "error",
          message: res.__("auth.notAuthrize"),
        });
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      let payload;

      try {
        payload = decodeToken(token); 
      } catch (err) {
        return res.status(401).json({
          status: "error",
          message: res.__("auth.tokenInvalid"),
        });
      }

      // Token expired
      if (payload.expiresIn < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          status: "error",
          message: res.__("auth.tokenExp"),
        });
      }

      req.user = payload;

      // Check if user type is allowed
      if (!allowedUserTypes.includes(req.user.type)) {
        return res.status(403).json({
          status: "error",
          message: res.__("denied"),
        });
      }

      const user = await Users.findOne({
        where: {
          id: payload.id,
          status: "Active",
          isVerified: true,
        },
        include: [{ model: Roles ,as : "roleDetails", attributes: ["id", "name", "accessId"] }],
      });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: res.__("auth.userInvalid"),
        });
      }

      const parsedAccessId = Array.isArray(user.roleDetails?.accessId)
        ? user.roleDetails.accessId
        : JSON.parse(user.roleDetails?.accessId || "[]");

      req.permission = req.permission || {};

      req.user.hasAccess = () => {
        if (!req.permission.module) return true;
        return parsedAccessId.includes(req.permission.module) || user.type === "Admin";
      };

      req.permission.global = user.type === "Admin" ||
        (req.module ? parsedAccessId.includes(`${req.module}-global`) : false);

      if (!req.user.hasAccess()) {
        return res.status(403).json({
          status: "error",
          message: res.__("denied"),
        });
      }

      next();
    } catch (err) {
      console.error("Middleware error:", err);
      return res.status(500).json({
        status: "error",
        message: res.__("auth.serverError"),
        result: err?.message || err,
      });
    }
  };
};

