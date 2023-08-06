const { faker } = require('@faker-js/faker');

function generateCarData() {
  const carData = {
    type: faker.vehicle.type(),
    name: faker.vehicle.vehicle(),
    model: faker.vehicle.model(),
    car_info: {
      fuel_type: faker.vehicle.fuel(),
      company: faker.vehicle.manufacturer(),
      car_number: faker.vehicle.vin(),
    },
  };

  return carData;
}


module.exports={generateCarData}
