const mongoose = require("mongoose");
require("dotenv").config();
const url = process.env.url;
const connect = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://ariuka:6969@hutao.la8hb.mongodb.net/"
    );
    console.log("successfully connected");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connect;
