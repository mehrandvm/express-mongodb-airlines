import express from "express";
import { healthcheck } from "./controllers/controller-healthcheck";
import cors from "cors";
import { Db, Document, MongoClient, ObjectId } from "mongodb";
import axios from "axios";

//create express app
const app: express.Express = express();
const router: express.Router = express.Router();

let db: Db | undefined;

const connectionString = `mongodb://localhost:27017/flights`;

interface Flight {
  actualtime?: string, city?: string, airline?: string, _id?: ObjectId
}

const getDataFromAPI = async () => {
  const {data} = await axios.get<{arrivals: Array<Document>, departures: Array<Document>,}>('https://www.flydulles.com/arrivals-and-departures/json')
  return data
}

MongoClient.connect(connectionString, function (err, client) {
  db = client?.db();
  app.listen(3000);
});

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(router); // tell the app this is the router we are using

router.get("/", healthcheck);

router.get("/arrivals", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("arrivals")
    .find(filter)
    .toArray(function (err, items) {
      res.send(items);
    });
});

router.post("/arrivals", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("arrivals").insertOne(
    filter,
    function () {
      res.send("Successfully inserted!");
    }
  );
});

router.put("/arrivals/:id", function (req, res) {
    const id = new ObjectId(req.params.id);
    const filter: Flight = {}
    if (req.body.time) filter.actualtime = req.body.time
    if (req.body.city) filter.city = req.body.city
    if (req.body.airline) filter.airline = req.body.airline
    db?.collection("arrivals").findOneAndUpdate(
    { _id: id },
    { $set: filter },
    function () {
      res.send("Successfully updated!");
    }
  );
});

router.delete("/arrivals", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("arrivals").deleteOne(filter, function () {
    res.send("Successfully deleted!");
  });
});

router.delete("/arrivals/all", function (req, res) {
  db?.collection("arrivals").deleteMany({}, function () {
    res.send("Successfully deleted arrivals!");
  });
});

router.get("/arrivals/seed", async function (req, res) {
  const data = await getDataFromAPI()
  db?.collection("arrivals").insertMany(data.arrivals, function () {
    res.send("Successfully added arrivals!");
  });
});