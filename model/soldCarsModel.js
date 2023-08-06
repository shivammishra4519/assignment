const Joi = require('joi');

const soldCarSchema = Joi.object({
    car_id: Joi.string().required(),
    vehicle_info: Joi.object({
        engine_type:Joi.string().required(),
        horsepower:Joi.number().required(), 
        fuel_efficiency: Joi.number().required(),
        owner_id:Joi.string().required()

    })
})


module.exports={soldCarSchema}