import express from "express";
import * as bodyParser from "body-parser";
import morgan from "morgan";
import * as path from "path";
import logger from "./config/winston";
import cors from "cors";
import { I18n } from "i18n";
import dataFilter from "./middleware/filter";
// import "./config/redis";

const app = express();

require("dotenv").config();

/* Cors middelware */
app.use(cors());

/* Express middelware */
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

/* system out middelware */
app.use(morgan("dev"));

app.use("/public", express.static(path.join(__dirname, "../public")));

// Set Global Variablee
global.config = require("./config/file-paths");

/* express middelware for body requests */
app.use(
  bodyParser.json({
    limit: "200mb",
  })
);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ limit: '200mb', extended: true }));


app.set("etag", false);

// Set Language
export const i18n = new I18n({
  locales : ["en", "fr"],
  directory: path.join(__dirname, "translation"),
  defaultLocale: "en",
  objectNotation: true,
  header: "locale",
});
app.use(i18n.init);

// stripe Web hook
// if (process.env.APP_ENV === "prod") {
//   app.use(
//     "/webhook/stripe/",
//     bodyParser.json({
//       verify: function (req, res, buf) {
//         req.rawBody = buf.toString();
//       },
//     }),
//     require("./routes/webhook.routes")
//   );
// } else {
//   app.use(
//     "/api/webhook/stripe/",
//     bodyParser.json({
//       verify: function (req, res, buf) {
//         req.rawBody = buf.toString();
//       },
//     }),
//     require("./routes/webhook.routes")
//   );
// }


// Apply GET api Filter Data
app.use(dataFilter);

/* Routes*/
// Set Global Variable
if (process.env.APP_ENV === "prod") {
  app.use("/", require("./routes/index.routes"));
} else {
  app.use("/api", require("./routes/index.routes"));
}

app.get("/*", (req, res) => {
  res.status(404).send("We couldn't find the endpoint you were looking for!");
});

/* Error handler (next) */
app.use(function (err, req, res, next) {
  if (err === "AccessDenied") {
    res.status(403).send({ status: "error", message: "Access Denied!" });
  }
  logger.error(err);
  res.statusMessage = err;
  res.status(500).send({
    status: "error",
    message: "Something wents wrong!",
    error: err,
  });
});

export default app;
