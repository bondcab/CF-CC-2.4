const express = require("express");

// Running the express package put in variable called app
const app = express();

// Adding port number to variable
const port = 8080;

// Console logs port application is listening on when ran
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Variable holding some classes from AWS SDK: S3 Client as well as commands to list and put objects
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

// Variable holding initiatated client object from S3Client above passing in configuration object
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
});

let listObjectsParams = {
  Bucket: "my-cool-local-bucket",
};

const IMAGES_BUCKET = "my-cool-local-bucket";

listObjectsCmd = new ListObjectsV2Command(listObjectsParams);

s3Client.send(listObjectsCmd);

// Endpoint returning the list of objects
app.get("/images", (req, res) => {
  listObjectsParams = {
    Bucket: IMAGES_BUCKET,
  };
  s3Client
    .send(new ListObjectsV2Command(listObjectsParams))
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse);
    });
});

const fs = require("fs");
const fileUpload = require("express-fileupload");

// Endpoint to check application response
app.get("/", (req, res) => {
  res.status(200).send("Application running");
});
