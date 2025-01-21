const { model, Schema } = require("mongoose");
const PathSchema = new Schema({
  id: String,
  path: Array,
  mode: String,
});

const PathModel = model("path", PathSchema);
module.exports = { PathModel };
