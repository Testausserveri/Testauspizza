const api = require('../kotipizza/api');

api.getHotStops().then(hotstops => {
    hotstops.forEach(stop => {
        console.log("ID: "+stop.deliveryHotSpotID+", Name: "+stop.name);
    });
})