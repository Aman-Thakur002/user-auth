import { Users } from "../models";
import PasswordHashing from "../utils/password-hashing";
import { i18n } from "../app";

export const userValidation = {
  name: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.firstName")
      }
    },
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.firstNameLength");
      },
      options: { min: 1 },
    },
  },
  email: {
    isEmail: {
      bail: true,
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.valid")
      }
    },
    custom: {
      options: (value, { req, location, path }) => {
        return Users.findOne({
          where: {
            email: value,
            status: "approved",
          },
        }).then((user) => {
          if (user) {
            return Promise.reject(i18n.__("users.alEmail"));
          }
        });
      },
    },
  },
  password: { 
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.required")
      }
    },
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.isValid");
      },
      options: { min: 8 },
    },
  },
  phone_number: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.phone.required")
      }
    },
    isInt: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("phoneNotformet");
      }
    },
  },
  // status: {
  //   matches: {
  //     options: [/\b(?:Active|Inactive|Deleted)\b/],
  //     errorMessage: "Invalid Status"
  //   }
  // }
};

export const userEditValidation = {
  name: {
    // exists: {
    //   errorMessage: i18n.__("user.firstName"),
    // },
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.firstName");
      },
      options: { min: 1 },
    },
  },
  phone_number: {
    // exists: {
    //   errorMessage: i18n.__("user.required.required"),
    // },
    // isInt: {
    //   errorMessage: i18n.__("user.required.valid"),
    // },
  },
  // status: {
  //   matches: {
  //     options: [/\b(?:Active|Inactive|Deleted)\b/],
  //     errorMessage: "Invalid Status"
  //   }
  // }
};

export const userLoginValidation = {
  email: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.required")
      }
    },
    isEmail: {
      bail: true,
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.valid")
      }
    },
  },
  password: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.required")
      }
    },
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.isValid");
      },
      options: { min: 7 },
    },
  },
};

export const changeStatusValidation = {
  status: {
    isLength: {
      errorMessage: "Status is required.",
      options: { min: 1 },
    },
  },
};

export const otpValidation = {
  email: {
    isEmail: {
      bail: true,
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.valid")
      }
    },
    custom: {
      options: (value, { req, location, path }) => {
        return Users.findOne({
          where: {
            email: value,
            status: "pending",
          },
        }).then((user) => {
          if (!user) {
            return Promise.reject("user.email.emailUse");
          }
        });
      },
    },
  },
};

export const verifyOtpValidation = {
  email: {
    isEmail: {
      bail: true,
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.valid")
      }
    },
  },
  otp: {
    isInt: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.otpValid")
      }
    },
  },
};

export const changePassword = {
  old_password: {
    custom: {
      options: (value, { req, location, path }) => {
        if (!value) return Promise.reject("Old Password is required");
        return Users.findOne({
          where: {
            id: req.user.id,
          },
        }).then(async (user) => {
          const checked = await PasswordHashing.comparePassword(
            value,
            user.password
          );
          if (!checked) {
            return Promise.reject("Old Password is Incorrect");
          }
        });
      },
    },
  },
  new_password: {
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.isValid");
      },
      options: { min: 7 },
    },
  },
};

export const forgetPassword = {
  otp: {
    isInt: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.otpValid");
      },
    },
  },
  new_password: {
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.password.isValid");
      },
      options: { min: 7 },
    },
  },
};


export const clientValidation = {
  name: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.firstName");
      },
    },
    isLength: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.firstName");
      },
      options: { min: 1 },
    },
  },
  email: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.required");
      },
    },
    isEmail: {
      bail: true,
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.email.valid");
      },
    },
    custom: {
      options: (value, { req, location, path }) => {
        return Users.findOne({
          where: {
            email: value,
            status: "approved",
          },
        }).then((user) => {
          if (user) {
            return Promise.reject(i18n.__("users.alEmail"));
          }
        });
      },
    },
  },
  phone_number: {
    exists: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("user.required.required");
      },
    },
    isInt: {
      errorMessage: (value, { req }) => {
        if (req.headers.locale == 'en') i18n.setLocale("en")
        else i18n.setLocale("en")
        return i18n.__("phoneNotformet");
      },
    },
  },
};