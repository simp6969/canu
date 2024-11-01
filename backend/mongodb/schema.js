const { model, Schema } = require("mongoose");

const DrawPath = new Schema({
  path: Array,
  id: String,
});

const DrawModel = model("SavedPaths", DrawPath);

module.exports = { DrawModel };
