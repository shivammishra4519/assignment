const Joi=require('joi');
const adminSchema=Joi.object({
    admin_id:Joi.string().required(),
    password:Joi.string().required()
})






module.exports =  {adminSchema};