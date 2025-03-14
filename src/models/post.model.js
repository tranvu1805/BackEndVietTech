"use strict";

const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Post";
const COLLECTION_NAME = "Posts";
// Declare the Schema of the Mongo model
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["publish", "draft", "canceled"],
      default: "publish",
    },
    account_id: {
      type: Types.ObjectId,
      required: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

//Export the model
module.exports = {
  post: model(DOCUMENT_NAME, postSchema),
};
