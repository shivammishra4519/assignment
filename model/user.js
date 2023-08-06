const Joi = require('joi');

const userSchema = Joi.object({
    user_email: Joi.string().required(),
    user_location: Joi.object({
        name: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }),
    user_info: Joi.object({
        name: Joi.string().required(),
        mobile: Joi.number().required(),
        id_proof: Joi.object({
            type_id: Joi.string().required(),
            id_number: Joi.string().required(),
        })
    }),
    password: Joi.string().required(),
    vechicle_info:Joi.array().items(Joi.string()),
});

const userLogin=Joi.object({
    user_email:Joi.string().required(),
    password:Joi.string().required()
});



module.exports={userSchema,userLogin}