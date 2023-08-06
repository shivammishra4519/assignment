const { getDB } = require('../dbconection');
const { soldCarSchema } = require('../model/soldCarsModel');
const express = require('express');
const { verifyToken } = require('../jwtVerify');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const soldCarRouter = new express.Router();

//  To add new vehicle to the list of sold vehicles after a deal is made only dealer can do this 
soldCarRouter.post('/soldcar/add', verifyToken, async (req, res) => {
    try {
        const data = req.body;
        const validateDataError = soldCarSchema.validate(data);
        if (validateDataError.error) {
            return res.status(400).json(validateDataError.error);
        }

        const decodedToken = jwt.verify(req.token, process.env.secretKey);
        const role = decodedToken.role;
        if (role !== 'dealer') {
            return res.status(400).json({ "message": "Invalid credentials" });
        }

        const isCarInDeal = await checkIsCarInDeal(decodedToken, data.car_id);
        if (isCarInDeal) {
            return res.status(400).json({ "message": "Car already in deal" });
        }

        const car_id = data.car_id;
        const owner_id = data.vehicle_info.owner_id;
        const dealership_email = decodedToken.dealership_email; // Using dealership_email from the decoded token
        const db = getDB();
        const collection = db.collection('soldcar');
        const checkCar = await collection.findOne({ car_id: car_id });
        if (checkCar) {
            return res.status(400).json({ "message": "Car already sold" });
        }

        const updateCar = await upadteOwnerInCar(car_id, owner_id);
        const updateDealer = await updateSoldInDealer(dealership_email, car_id); // Using dealership_email here
        const updateInUser = await updateCarInUser(owner_id, car_id);

        if (updateCar && updateDealer && updateInUser) {
            const response = await collection.insertOne(data);
            return res.status(200).json({ "message": "Car added to sold successfully." });
        } else {
            return res.status(500).json({ "message": "Failed to update records. Please try again." });
        }
    } catch (err) {
        console.error("Error:", err); // Log the error for debugging
        return res.status(500).json({ "message": "Server error" });
    }
});


// route for delete car from deal after car sold
soldCarRouter.delete('/soldcar/delete/:car_id', verifyToken, async (req, res) => {
    try {
        const car_id = req.params.car_id;
        const decodedToken = jwt.verify(req.token, process.env.secretKey);
        const role = decodedToken.role;
        if (role !== 'dealer') {
            return res.status(400).json({ "message": "Invalid credentials" });
        }

        const dealership_email = decodedToken.dealership_email;
        const db = getDB();
        const collection = db.collection('dealer');
        const result = await collection.findOne({ dealership_email: dealership_email });
        const deal = result.deal || [];
        const carExists = deal.includes(car_id);
        if (!carExists) {
            return res.status(400).json({ "message": "Car not found in the dealer's deal" });
        }

        const updatedDeal = deal.filter((car) => car !== car_id);
        await collection.updateOne(
            { dealership_email: dealership_email },
            { $set: { deal: updatedDeal } }
        );

        return res.status(200).json({ "message": "Car removed from the deal successfully." });
    } catch (err) {
        console.error("deleteFromDeal error:", err);
        return res.status(500).json({ "message": "Server error" });
    }
});


async function checkIsCarInDeal(decodedToken, car_id) {
    try {
        const dealership_email = decodedToken.dealership_email;
        const db = getDB();
        const collection = db.collection('dealer');
        const result = await collection.findOne({ dealership_email: dealership_email });
        const cars = result.cars;
        const carExit = cars.includes(car_id);
        return carExit;
    } catch (err) {
        console.error("checkIsCarInDeal error:", err);
        throw err; // Re-throw the error to be caught in the main catch block
    }
}

async function upadteOwnerInCar(car_id, owner_id) {
    try {
        const db = getDB();
        const collection = db.collection('cars');
        const objectId = new ObjectId(car_id);
        const newKey = 'owner_id';
        const newValue = owner_id;
        const updateQuery = {
            $set: { ['car_info.' + newKey]: newValue },
        };
        const result = await collection.updateOne({ _id: objectId }, updateQuery);
        return result;
    } catch (err) {
        console.error("upadteOwnerInCar error:", err);
        throw err;
    }
}

async function updateSoldInDealer(dealership_email, car_id) {
    try {
        const db = getDB();
        const collection = db.collection('dealer');
        const updateQuery = {
            $push: { sold_vehicles: car_id },
        };
        const result = await collection.updateOne({ dealership_email: dealership_email }, updateQuery);
        return result;
    } catch (err) {
        console.error("updateSoldInDealer error:", err);
        throw err;
    }
}

async function updateCarInUser(owner_id, car_id) {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const objectId = new ObjectId(owner_id);
        const updateQuery = {
            $push: { vechicle_info: car_id },
        };
        const result = await collection.updateOne({ _id: objectId }, updateQuery);
        return result;
    } catch (err) {
        console.error("updateCarInUser error:", err);
        throw err;
    }
}



module.exports = { soldCarRouter };






