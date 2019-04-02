import * as functions from 'firebase-functions';
import * as request from 'superagent';

const URL = 'https://api.voiapp.io/v1/vehicle/status/ready';
const OSLO = {
  lat: 59.913868,
  long: 10.752245
};

export const nearbyVOI = functions.https.onRequest(async (req, res) => {
  try {
    const apiRes = await request.get(`${URL}?la=${OSLO.lat}&lo=${OSLO.long}`);
    res.status(200).send(apiRes);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});
