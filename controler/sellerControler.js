const express = require('express');
const { dealershipSchema, dealer_login, addCarSchema } = require('../model/sellerModel')
const { getDB, connectToDB } = require('../dbconection');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../jwtVerify');
const { insertData } = require('./carControler');
require('dotenv').config()
const sellerRouter = new express.Router();
sellerRouter.use(bodyParser.json());

sellerRouter.post('/add/dealer', async (req, res) => {
    try {
        let data = req.body;
        const db = await getDB();
        const collection = db.collection('dealer');
        const validateDataError = dealershipSchema.validate(data);
        if (validateDataError.error) {
            res.status(400).json(validateDataError.error);
        } else {
            const email = data.dealership_email;
            const result = await collection.findOne({ dealership_email: email });
            if (result) {
                res.status(400).json({ message: "email already exit" })
            } else {
                const salt = await bcrypt.genSalt(10);
                const secPass = await bcrypt.hash(data.password, salt);
                data.password = secPass;
                const response = await collection.insertOne(data);
                res.status(200).json({ response });
            }

        }

    } catch (err) {
        res.status(400).json({ err })
    }
});


sellerRouter.post('/dealer/login', async (req, res) => {
    try {
        let data = req.body;
        let db = await getDB();
        let collection = await db.collection('dealer');
        const validateDataError = dealer_login.validate(data);
        if (validateDataError.error) {
            res.status(400).json(validateDataError.error);
        } else {
            const email = await data.dealership_email;
            const result = await collection.findOne({ dealership_email: email });
            if (await bcrypt.compare(data.password, result.password)) {
                const token = jwt.sign({ dealership_email: email, role: 'dealer' }, process.env.secretKey, { expiresIn: '1h' })
                res.status(200).json({ token })
            } else {
                res.status(400).json({ error: "Invalid credentials" })
            }

        }

    } catch (err) {
        res.status(400).json(err)
    }
});

sellerRouter.get('/dealer/soldcar', verifyToken, async (req, res) => {
    try {
        jwt.verify(req.token, process.env.secretKey, async (err, decode) => {
            if (err) {
                res.status(400).json({ message: "invalid token or experied" });
            } else {
                const db = await getDB();
                const collection = await db.collection('dealer');
                const result = await collection.find().toArray();
                let array = [];
                for (let i = 0; i < result.length; i++) {

                    let obje = {
                        dealershipName: await result[i].dealership_name,
                        soldCar: await result[i].sold_vehicles,
                        cars: await result[i].cars
                    }
                    array.push(obje);
                }

                res.status(200).json({ array })
            }
        })

    } catch (err) {
        res.status(400).json(err)
    }
})


// . To view dealerships with a certain car

sellerRouter.post('/view/car/dealership', verifyToken, async (req, res) => {
    try {
        const car_id = req.body.car_id;
        jwt.verify(req.token, process.env.secretKey, async (err, decode) => {
            if (err) {
                res.status(400).json(err);
            } else {
                const db = getDB()
                const collection = db.collection('dealer');
                const dealersWithCar = await collection.find({ cars: car_id }).toArray();
                if (dealersWithCar.length === 0) {
                    res.status(404).json({ message: "No dealers found with the specified car." });
                } else {
                    const dealers = dealersWithCar.map(dealer => ({
                        dealership_name: dealer.dealership_name,
                        dealership_location: dealer.dealership_location
                    }));
                    res.status(200).json({ dealers })
                }


            }
        })

    } catch (err) {
        res.status(400).json(err)
    }
})


async function findCar(carName) {
    const db = getDB()
    const collection = db.collection('cars');
    const result = await collection.find({ name: carName }).toArray();
    console.log("ghj", result)
    let car_id = result.map(obj => obj._id);
    return car_id;
}
async function findDealer(car_id) {
    const db = getDB()
    const collection = db.collection('dealer');
    const result = await collection.find({ name: carName }).toArray();
}

// api for add car in dealership  only admin can upadte

sellerRouter.post('/add/car/dealership', verifyToken, async (req, res) => {
    try {
        jwt.verify(req.token, process.env.secretKey, async (err, decode) => {
            if (err) {
                res.status(400).json(err);
            } else {
                let decodedToken = jwt.decode(req.token);
                const role = decodedToken.role;
                if (role == 'admin') {
                    const validateDataError = addCarSchema.validate(req.body);
                    if (validateDataError.error) {
                        res.status(400).json(validateDataError.error);
                    } else {
                        const db = getDB();
                        const collection = db.collection('dealer');
                        const id = req.body.id;
                        const car = req.body.car_id;
                        const objectId = new ObjectId(id);
                        const result = await collection.findOne({ _id: objectId });
                        let carArray = result.cars || []; // Initialize carArray to an empty array if it is not already present

                        // Check if the car already exists in the carArray
                        let carExists = carArray.includes(car);
                        if (carExists) {
                            res.status(400).json({ 'message': "Car already exists" });
                        } else {
                            carArray.push(car); // Add the new car to the carArray
                           const response= await collection.updateOne({ _id: objectId }, { $set: { cars: carArray } });
                            console.log('New car added successfully.');
                            const updatedDealer = await collection.findOne({ _id: objectId });
                            res.status(200).json(response);

                        }
                    }
                } else {
                    res.status(400).json({ message: "Invalid credentials" });
                }
            }
        });
    } catch (err) {
        res.status(400).json({ err });
    }
});

// add car in deal  only dealer can add this
sellerRouter.post('/add/car/deal', verifyToken, async (req, res) => {
    try {
      jwt.verify(req.token, process.env.secretKey, async(err,decode)=>{

        if(err){
            res.status(400).json(err);
        }else{
            const decodedToken=jwt.decode(req.token);
            const role = decodedToken.role;
            const dealership_email = decodedToken.dealership_email;
            console.log(dealership_email,decodedToken)
    
            if (role == 'dealer') {
                const db = getDB();
                const collection = db.collection('dealer');
                const result = await collection.findOne({ dealership_email: dealership_email });
    
                if (result) {
                    const deal = result.deal || [];
                    const car_id = req.body.id;
    
                    if (deal.includes(car_id)) {
                        res.status(400).json({ "message": "Car already in deal" });
                    } else {
                        deal.push(car_id);
                        await collection.updateOne(
                            { dealership_email: dealership_email },
                            { $set: { deal: deal } }
                        );
                        res.status(200).json({ "message": "Car added to deal successfully." });
                    }
                } else {
                    res.status(400).json({ "message": "Dealer not found." });
                }
            } else {
                res.status(400).json({ "message": "Invalid credentials" });
            }
        }
      });
        
        
    } catch (error) {
        res.status(500).json({ "message": "Server error" });
    }
});




// To view all vehicles dealership has sold   , To view all cars sold by dealership 

sellerRouter.post('/soldcar/view', verifyToken, async (req, res) => {
    const decodeTokenPromice = new Promise((resolve, reject) => {
        jwt.verify(req.token, process.env.secretKey, (err, decode) => {
            if (err) {
                reject(err);
            } else {
                resolve(decode)
            }
        });
    });
    decodeTokenPromice.then((token) => {
        const dealership_email = token.dealership_email;
        const role = token.role;
        const db = getDB();
        const collection = db.collection('dealer');
        if (role == 'dealer' && !req.body.id) {

            const result = collection.findOne({ dealership_email: dealership_email });
            return result
        }
        if (req.body.id) {

            const id = new ObjectId(req.body.id);
            const result = collection.findOne({ _id: id });
            return result;

        }
        else {
            throw new Error("Invalid credentials");
        }
    }).then((result) => {
        if (result) {
            const soldCar = result.sold_vehicles;
            return soldCar;
        } else {
            throw new Error("Dealer not found.");
        }
    }).then((soldCar) => {
        res.status(200).json(soldCar);
    }).catch((err) => {
        res.status(500).json(err)
    })
});


//  To view deals provided by dealership dealer and user and admin can view

sellerRouter.get('/view/deals', verifyToken, (req, res) => {
    const decodedTokenPromise = new Promise((resolve, reject) => {
        jwt.verify(req.token, process.env.secretKey, (err, decode) => {
            if (err) {
                reject(err);
            } else {
                resolve(decode);
            }
        });
    });

    decodedTokenPromise
        .then(decodedToken => {
            const role = decodedToken.role;
            const dealership_email = decodedToken.dealership_email;
            const id = req.body.id; 
            const db = getDB();
            const collection = db.collection('dealer');
            if (role === 'dealer' && !id) {
                return collection.findOne({ dealership_email: dealership_email });
            } else if (id) {
                const objectId = new ObjectId(id);
                return collection.findOne({ _id: objectId });
            } else {
                throw new Error("Invalid credentials.");
            }
        })
        .then(result => {
            if (result) {
                
                const deal = result.deal;
                res.status(200).json({ deal });
            } else {
                throw new Error("Dealer not found.");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            res.status(500).json({ message: "Server error" });
        });
});



module.exports = sellerRouter;

