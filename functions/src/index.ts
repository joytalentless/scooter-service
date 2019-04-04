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
    // const groups = R.groupBy((vehicle: any) => vehicle.location[0]location[0], vehicles);
    const oslo = R.filter((it: any) => {
      console.log(`LAT: ${R.prop('location', it)[0]}`);
      return R.contains('59', R.toString(R.prop('location', it)[0]));
    }, vehicles);

    res.status(200).send(oslo);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});
