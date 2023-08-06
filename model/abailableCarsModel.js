const Joi = require('joi');

const dealsSchema = Joi.object({
    car_id: Joi.string().required(),
    deal_info: Joi.object({
        financing_available:Joi.string().required(), 
        down_payment_percentage:Joi.string().required(), 
        financing_terms:Joi.string().required()
    })
})



model.exports = { dealsSchema };