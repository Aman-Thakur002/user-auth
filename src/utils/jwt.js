const { Users } = require("../models");

import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET;

// Function to Create Token
export function createAccesstoken(user) {
  const EXPIRE_IN = Math.floor(new Date().getTime() / 1000) + 24 * 24 * 60 * 60;
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      expiresIn: EXPIRE_IN,
    },
    SECRET_KEY
  ); 
  // Update Token to user table
  let date = new Date()
  const updateObj = {
    accessToken: token,
    lastLogin: date
  };
 

  Users.update(updateObj, { where: { id: user.id } });
  return token;
 }


// Function To Decode Token
export function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY);
}
