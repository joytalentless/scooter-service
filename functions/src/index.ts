import * as functions from 'firebase-functions';
import * as request from 'superagent';
import * as R from 'ramda';

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
    const vehicles = JSON.parse(apiRes.text);
    const groups = R.groupBy((vehicle: any) => vehicle.zone, vehicles);

    res.status(200).send(groups);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});
