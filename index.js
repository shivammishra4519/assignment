const express=require('express');
const sellerRouter=require('./controler/sellerControler');
const {connectToDB}=require('./dbconection');
const Router=require('./controler/adminControler');
const userRouter=require('./controler/userControler');
const {carRouter}=require('./controler/carControler');
const {soldCarRouter}=require('./controler/soldaCarControler');


const app=express();

app.use(express.json())
app.use(sellerRouter);
app.use(Router);
app.use(userRouter);
app.use(carRouter);
app.use(soldCarRouter);

app.get('/',(req,res)=>{
    res.send("welcome to the home page")
})
connectToDB()
app.listen(3000,()=>{
    console.log("server is runing on port number 3000")
})