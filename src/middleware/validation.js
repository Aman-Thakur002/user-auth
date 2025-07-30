const { validationResult } = require("express-validator");
export default (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      type: "validationError",
      errors: errors.array(),
    });
  } else {
    next();
  }
};


