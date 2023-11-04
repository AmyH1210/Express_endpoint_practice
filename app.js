const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();  //make an instance of express

//allow us to access to .env
require('dotenv').config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PORT:", process.env.DB_PORT);

const port = process.env.PORT;  // default port to listen

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

//receive request from a port(front end)
app.use(cors(corsOptions));

//middleware function
app.use(async function(req, res, next) {
  try {

    //connecting to database
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    //release connection to database when things are done
    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});


app.use(express.json());



//select all cars_ endpoint function
app.get('/cars', async function(req, res) {
  try {
    const [cars] = await req.db.query(
      'SELECT * FROM cars;'
      );
    res.json({ success: true, message: 'Car data retrieved successfully', data: cars });
    console.log(`/cars`)
  } catch (err) {
    res.json({ success: false, message: err, data: null });
  }
});

//middleware function
app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {

  }
});


app.post('/cars', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

//delete a data from database function
app.delete('/cars/:id', async function(req,res) {
  try {
    const id = req.params.id;
    const query = await req.db.query(
      `UPDATE cars 
       SET deleted_flag = 1 
       WHERE id = :id`,
      { id }
    );

    console.log('req.params /cars/:id', req.params)
    
    
      res.json({ success: true, message: 'Car deleted successfully', data: null });
 
  } catch (err) {
    console.log("error")
    res.status(500).json({ success: false, message: err, data: null });
  }
});

//Update a car_endpoint function
app.put('/cars', async function(req,res) {
  try {
    const {id, make, model, year } = req.body;
  
    const query = await req.db.query(
      `UPDATE cars 
      SET make = :make, model = :model, year = :year
      WHERE id = :id `,
      {
        id,
        make,
        model,
        year,
      }
    );

    if (query[0].affectedRows > 0) {
      res.json({ success: true, message: 'Car updated successfully', data: null });
    } else {
      res.status(404).json({ success: false, message: 'Car not found or no changes made', data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err, data: null });
  }
});

app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));