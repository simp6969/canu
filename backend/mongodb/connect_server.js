const mongoose = require("mongoose");
require("dotenv").config({ path: `${__dirname}/../../.env.local` });

const url = process.env.MONGO_DB;

const connect = async () => {
  try {
    await mongoose.connect(url);
    console.log("successfully connected");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connect;
