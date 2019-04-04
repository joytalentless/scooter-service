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

    const oslo = R.filter(
      (it: any) => R.contains('59.', R.toString(R.prop('location', it)[0])),
      vehicles
    );

    console.log(`Bikes in Oslo ${R.length(oslo)}`);

    res.status(200).send(oslo);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});
