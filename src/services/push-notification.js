import { Op } from "sequelize";
const admin = require("../utils/firebase");
const { NotificationHistories, UserFcmTokens } = require("../models");

//============<< SEND NOTIFICATION >>========================
export async function sendNotification(userIds,customOrderId, title, body, data = {}) {
  try {
    const fcmTokens = await UserFcmTokens.findAll({
      where: {
        userId: {
          [Op.in]: userIds,
        },
      },
    });
  
    const tokens = fcmTokens.map((data) => data.fcmToken);

    if (!tokens.length)
      return { success: false, message: "No FCM tokens found" };
    const messages = tokens.map((token) => ({
      token: token,
      notification: { title, body },
      data,
    }));
    await admin.messaging().sendEach(messages);
    console.log("Notification sent !!")
    const notificationObj = userIds.map((userId) => {
      return {
        userId,
        customOrderId,
        title,
        body,
        path: data.path || null,
        note: data.note || null,
      };
    });
    await NotificationHistories.bulkCreate(notificationObj);
    return;
  } catch (error) {
    console.error("FCM Notification Error:", error);
    return { success: false, error };
  }
}

//============<< TEST NOTIFICATION >>========================
export async function testSendNotification(req, res) {
  const { fcmToken, title, body, data } = req.body;
  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data,
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      message: "Notification sent successfully",
      messageId: response,
      status: "success",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to send notification",
      messageId: null,
      status: "failed",
    });
  }
}
