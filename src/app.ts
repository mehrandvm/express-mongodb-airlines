import express from "express";
import { healthcheck } from "./controllers/controller-healthcheck";
import cors from "cors";
import { Db, Document, MongoClient, ObjectId } from "mongodb";
import axios from "axios";
import cheerio from 'cheerio'
//create express app
const app: express.Express = express();
const router: express.Router = express.Router();

let db: Db | undefined;
const crawlUrl = 'https://sacramento.aero/smf/flight-and-travel/flight-status'
const connectionString = `mongodb://localhost:27017/flights`;

interface Flight {
  actualtime?: string, city?: string, airline?: string, _id?: ObjectId
}

interface FlightArrival {
  flightNo?: string, airline?: string, from?: string, time?: string, status?: string, gate?: string
}

interface FlightDeparture {
  flightNo?: string, airline?: string, to?: string, time?: string, status?: string, gate?: string
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

// ------------- Arrivals ---------------

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

// ------------- Departures ---------------

router.get("/departures", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("departures")
    .find(filter)
    .toArray(function (err, items) {
      res.send(items);
    });
});

router.post("/departures", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("departures").insertOne(
    filter,
    function () {
      res.send("Successfully inserted!");
    }
  );
});

router.put("/departures/:id", function (req, res) {
  const id = new ObjectId(req.params.id);
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  db?.collection("departures").findOneAndUpdate(
    { _id: id },
    { $set: filter },
    function () {
      res.send("Successfully updated!");
    }
  );
});

router.delete("/departures", function (req, res) {
  const filter: Flight = {}
  if (req.body.time) filter.actualtime = req.body.time
  if (req.body.city) filter.city = req.body.city
  if (req.body.airline) filter.airline = req.body.airline
  if (req.body.id) filter._id = new ObjectId(req.body.id)
  db?.collection("departures").deleteOne(filter, function () {
    res.send("Successfully deleted!");
  });
});

router.delete("/departures/all", function (req, res) {
  db?.collection("departures").deleteMany({}, function () {
    res.send("Successfully deleted departures!");
  });
});

router.get("/departures/seed", async function (req, res) {
  const data = await getDataFromAPI()
  db?.collection("departures").insertMany(data.departures, function () {
    res.send("Successfully added departures!");
  });
});

// scraper arrival
router.get("/arrivals/scrape", async function (req, res) {
  axios.get(crawlUrl)
    .then(function(response){
      const data = [];
      const rowNum = cheerio(".table-arrival > tbody > tr", response.data).length
      console.log('rowNum', rowNum);
      for (let i = 1; i <= rowNum; i++) {
        const columnNum = cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td`, response.data).length
        console.log('columnNum', columnNum);
        const row: FlightArrival = {};
        for (let j = 1; j <= columnNum; j++) {
          switch (j) {
            case 1:
              row.flightNo = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 2:
              row.airline = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 3:
              row.from = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 4:
              row.time = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 5:
              row.status = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 6:
              row.gate = (cheerio(`.table-arrival > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            default:
              break;
          }
        }
        data.push(row)
      }
      db?.collection("arrivals").insertMany(data, function () {
        res.send("Successfully scraped arrivals!");
      });
    })
    .catch(function(){
      //handle error
    });
});

// scraper departure
router.get("departures/scrape", async function (req, res) {
  axios.get(crawlUrl)
    .then(function(response){
      const data = [];
      const rowNum = cheerio(".table-departure > tbody > tr", response.data).length
      console.log('rowNum', rowNum);
      for (let i = 1; i <= rowNum; i++) {
        const columnNum = cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td`, response.data).length
        console.log('columnNum', columnNum);
        const row: FlightDeparture = {};
        for (let j = 1; j <= columnNum; j++) {
          switch (j) {
            case 1:
              row.flightNo = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 2:
              row.airline = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 3:
              row.to = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 4:
              row.time = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 5:
              row.status = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            case 6:
              row.gate = (cheerio(`.table-departure > tbody > tr:nth-child(${i}) > td:nth-child(${j})`, response.data).text().trim())
              break;
            default:
              break;
          }
        }
        data.push(row)
      }
      db?.collection("departures").insertMany(data, function () {
        res.send("Successfully scraped departures!");
      });
    })
    .catch(function(){
      //handle error
    });
});