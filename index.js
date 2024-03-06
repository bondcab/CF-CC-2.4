// Express package to simply create web application
const express = require("express");

// Get path package
const path = require("path");

// Running the express package put in variable called app
const app = express();

// Adding port number to variable
const port = 8080;

// Console logs port application is listening on when ran
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Variable holding the file system module
const fs = require("fs");

// Variable holding the "express-fileupload" package which allows you to take file sent to endpoint and upload to S3
const fileUpload = require("express-fileupload");

// Tells Express to use the file upload middleware
app.use(fileUpload());

// Variable holding some classes from AWS SDK: S3 Client as well as commands to list and put objects
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

// Variable holding initiatated client object from S3Client above passing in configuration object
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
});

// Variable holding the bucket name
const IMAGES_BUCKET = "my-cool-local-bucket";

// Variable holding configuration object being passed into S3Client client class
const listObjectsParams = {
  Bucket: IMAGES_BUCKET,
};

// Variable holding the command to list objects in S3 bucket
let listObjectsCmd = new ListObjectsV2Command(listObjectsParams);

// Variable holding the path to the folder where images will be uploaded to
const UPLOAD_TEMP_PATH = path.join(__dirname, "uploaded_images");

// Endpoint returning the list of objects
app.get("/images", (req, res) => {
  s3Client.send(listObjectsCmd).then((listObjectsResponse) => {
    res.send(listObjectsResponse);
  });
});

// Endpoint to check application response
app.get("/", (req, res) => {
  res.status(200).send("Current directory: " + UPLOAD_TEMP_PATH);
});

// Endpoint which handles file uploads
app.post("/images", async (req, res) => {
  try {
    const file = req.files.image; // Variable holding the information extracted from the request file object via "express-fileupload"
    const fileName = req.files.image.name; // Variable holding the name of the image
    const tempPath = `${UPLOAD_TEMP_PATH}/${fileName}`; // Variable holding the file path you want image moved into to temporarily

    await new Promise((resolve, reject) => {
      file.mc(tempPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const fileContent = await fs.promises.readFile(tempPath);

    // Variable holding configurarion object for uploading object command
    const uploadObjectsParams = {
      Body: fileContent,
      Bucket: IMAGES_BUCKET,
      Key: fileName,
    };

    // Variable holding the command to upload objects to S3 bucket
    let uploadObjectsCmd = new PutObjectCommand(uploadObjectsParams);

    s3Client.send(uploadObjectsCmd);

    res.status(200).send("Image uploaded successfully");
  } catch (error) {
    console.error("Error uploading image: ", error);
    res.status(500).send("Error uploading image");
  }
});

// Endpoint for getting object from S3 bucket
app.get("/image/:key", (req, res) => {
  const key = req.params.key;
  console.log("Object key requested: ", key);

  // Parameters for the GetObjectCommand
  const getObjectParams = {
    Bucket: IMAGES_BUCKET,
    Key: key,
  };

  // Variable holding the GetObjectCommand
  const getObjectCommand = new GetObjectCommand(getObjectParams);

  s3Client
    .send(getObjectCommand)
    .then((s3Response) => {
      // Check if the response contains the Body property
      if (s3Response.Body) {
        // Pipe the Body stream (image data) to the response stream
        s3Response.Body.pipe(res);
      } else {
        // Handle case where Body is not available
        res.status(500).send("Error: Image data not available");
      }
    })
    .catch((error) => {
      console.error("Error fetching object from S3:", error);
      res.status(500).send("Error fetching object from S3");
    });
});
