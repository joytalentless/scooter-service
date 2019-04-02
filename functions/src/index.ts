import * as functions from 'firebase-functions';
import * as request from 'superagent';

const URL = 'https://api.voiapp.io/v1/vehicle/status/ready';
const OSLO = {
  lat: 59.913868,
  long: 10.752245
};

export const nearbyVOI = functions.https.onRequest(async (req, res) => {
  try {
    const apiRes: request.Response = await request.get(
      `${URL}?la=${OSLO.lat}&lo=${OSLO.long}`
    );
    console.log(JSON.parse(apiRes.text));
    res.status(200).send(JSON.parse(apiRes.text));
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});
