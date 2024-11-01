const express = require("express");
const pathModule = require("./mongodb/schema.js");
const cors = require("cors");
const connectMongo = require("./mongodb/connect_server.js");

const app = express();
connectMongo();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  await res.json({ status: 200, name: "HuTao" });
});

app.post("/path", async (req, res) => {
  const body = req.body;
  const model = {
    path: body.path,
    id: body.id,
  };
  await pathModule.DrawModel.create(model);
  res.json({ status: 200, name: "HuTao" });
});

app.get("/path/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pathModule.DrawModel.findOne({ id: id });
  res.json(result);
});

app.listen(8080);
