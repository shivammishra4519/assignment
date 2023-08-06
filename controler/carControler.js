const express = require('express');
const { carSchema } = require('../model/carSchema');
const { generateCarData } = require('./faker');
const { getDB } = require('../dbconection');
const { verifyToken } = require('../jwtVerify')
const carRouter = new express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.secretKey;
// post api for add car data
carRouter.post('/add/car', verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretKey, async (err, decodeToken) => {
      if (err) {
        res.status(400).json({ message: "invalid token or expired" })
      } else {
        let decode = await jwt.decode(req.token);
        let role = decode.role;
        console.log(role)
        if (role == 'admin' || role=='dealer') {
          try {
            const data = req.body;
            let validateDataError = carSchema.validate(data);
            if (validateDataError.error) {
              res.status(400).json({ message: "validation failed", validateDataError })
            } else {
              const db = getDB();
              const collection = await db.collection('cars');
              const result = await collection.insertOne(data);
              res.status(200).json(result);
            }
          } catch (error) {
            res.status(500).json({ error: "Internal server error" });
          }
        } else {
          res.status(400).json({ message: "invalid credentials" })
        }
      }
    });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// for view car 
carRouter.get('/view/car', verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretKey, async (err, decodeToken) => {
      if (err) {
        res.status(400).json({ message: "invalid token or experied" })
      } else {
        let decode = await jwt.decode(req.token);
        let role = decode.role;
        if (role == 'user' || role == 'dealer' || role == 'admin') {
          const db = await getDB();
          const collection = await db.collection('cars');
          const result = await collection.find().toArray();
          res.status(200).json(result)
        } else {
          res.status(400).json({ message: "invalid credentials" })
        }
      }
    })
  } catch (err) {
    res.status(400).json(err)
  }

})

// function for inserting data using fekar
async function insertData(count) {
  for (let i = 0; i < count; i++) {
    let data=generateCarData();
    const db=getDB();
    const collection=db.collection('cars');
    const result=await collection.insertOne(data);
  }
}



module.exports = { carRouter , insertData}
