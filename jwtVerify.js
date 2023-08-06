

function verifyToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token =  authHeader.split(' ')[1];
    if (token == null){
return res.sendStatus(401);
    } else{
       req.token=token;
       next() 
    }
    

}

module.exports={verifyToken}