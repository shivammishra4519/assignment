const express = require('express');
const bcrypt = require('bcryptjs');
const { adminSchema } = require('../model/admin');
const { getDB } = require('../dbconection');
const jwt=require('jsonwebtoken');
const Router = new express.Router();
require('dotenv').config();

Router.post('/admin', async (req, res) => {
    try {
        const data = req.body;
        const validationErrors = adminSchema.validate(data);
        if (validationErrors.error) {
            res.status(400).json({ error: validationErrors });
        } else {
            let id = data.admin_id;
            const db = getDB();
            const collection1 = db.collection('admin');
            const result1 = await collection1.findOne({ admin_id: id });
            console.log("res", result1)
            if (result1) {
                console.log("Email already exists:", result1);
                res.status(400).json({ error: "Email already exists" });
            } else {
                const salt = await bcrypt.genSalt(10);
                const secPass = await bcrypt.hash(data.password, salt);
                data.password = secPass;
                const collection = db.collection('admin');
                const result = await collection.insertOne(data);
                res.json(result);
            }
        }
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// login api for admin
Router.post('/admin/login', async (req, res) => {
    try {
        const data=req.body;
        const validateDataError=adminSchema.validate(data);
        if(validateDataError.error){
            res.status(400).json(validateDataError.error);
        }
        else{
            const id=data.admin_id;
            const db=await getDB();
            const collection=await db.collection('admin');
            const result=await collection.findOne({admin_id:id});
            if(await bcrypt.compare(data.password,result.password)){
               const token= jwt.sign({admin_id:id, role:'admin'},process.env.secretKey,{expiresIn:'1h'})
               res.status(200).json({token})
            }
        }
        
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = Router;
