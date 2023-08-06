const Joi = require('joi');

const dealershipSchema = Joi.object({
    dealership_email: Joi.string().required(),
    dealership_name: Joi.string().required(),
    dealership_location: Joi.object({
        name: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }),
    password: Joi.string().required(),
    dealership_info: Joi.object({
        mobile: Joi.number().required(),
        id_proof: Joi.object({
            type_id: Joi.string().required(),
            id_number: Joi.string().required(),
        })
    }),
    cars: Joi.array().items(Joi.string()),
    deals: Joi.array().items(Joi.string()),
    sold_vehicles: Joi.array().items(Joi.string()),
})


const dealer_login=Joi.object({
    password:Joi.string().required(),
    dealership_email:Joi.string().required()
    
})

const addCarSchema=Joi.object({
   id:Joi.string().required(),
    car_id:Joi.string().required()
})


module.exports ={dealershipSchema ,dealer_login,addCarSchema}