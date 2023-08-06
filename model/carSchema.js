const Joi = require('joi');

const carSchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  model: Joi.string().required(),
  car_info: Joi.object({
    fuel_type: Joi.string().required(),
    company: Joi.string().required(),
    car_number: Joi.string().required(),
  }).required(),
});





module.exports = {carSchema};