const express = require('express');
const { getDB } = require('../dbconection');
const bodyParser = require('body-parser');
const { userSchema, userLogin } = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
require('dotenv').config()


const userRouter = new express.Router();
userRouter.use(bodyParser.json());


userRouter.post('/add/user', async (req, res) => {

  try {
    let data = req.body;
    let validateDataError = userSchema.validate(data);
    if (validateDataError.error) {
      res.status(400).json(validateDataError.error);
    } else {
      const email = data.user_email;
      const db = await getDB();
      const collection = await db.collection('users');
      const result = await collection.findOne({ user_email: email });
      if (result) {
        res.status(400).json({ error: "Email already exists" });
      }
      else {
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(data.password, salt);
        data.password = secPass;
        const response = await collection.insertOne(data);
        res.status(200).json(response)
      }
    }

  } catch (error) {
    res.status(400).json(error);
  }
})


// login api 
userRouter.post('/user/login', async (req, res) => {
  try {
    const db = await getDB();
    const collection = await db.collection('users');
    const data = req.body;
    const validateDataError = userLogin.validate(data);

    if (validateDataError.error) {
      return res.status(400).json(validateDataError.error);
    }

    const email = data.user_email;
    const response = await collection.findOne({ user_email: email });

    if (!response) {
      // Invalid credentials (User not found)
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user_password = data.password;
    const db_password = response.password;

    // Check if the password matches
    const isPasswordMatch = await bcrypt.compare(user_password, db_password);

    if (!isPasswordMatch) {
      // Invalid credentials (Password doesn't match)
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate and return the JWT token
    const token = jwt.sign({ user_email: email, role: 'user' }, process.env.secretKey, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});







module.exports = userRouter;