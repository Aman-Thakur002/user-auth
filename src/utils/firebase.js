const admin = require("firebase-admin");
const path = require("path");

// Load Firebase service account key
const serviceAccount = require('../config/firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
