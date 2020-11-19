/**
 * Temporary endpoint to convert Bolt GBFS feed to v2.1
 *
 * This endpoint exists solely to have real data to develop
 * mobility v2 api against, and should not be used by external
 * parties.
 *
 * The duplication of code in this file is therefore intentional,
 * to avoid coupling with the rest of the codebase as much as possible
 *
 */
import * as functions from 'firebase-functions'
import * as request from 'superagent'
import * as express from 'express';
import { Bolt } from './utils/interfaces';
import { logError } from './utils/logging';
import { Operator } from './utils/operators';
import { boltOsloScooterPrise } from './utils/constants';

const  app = express();

export async function boltRequest(url: string, token: string): Promise<Bolt[]> {
    const boltResponse: request.Response = await request
        .get(url)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json');
    return JSON.parse(boltResponse.text)
}

async function refreshBoltToken(user: string, pass: string): Promise<string> {
    console.log(
        `Refreshing ${Operator.BOLT.toLowerCase()} token with user ${user}`
    );
    try {
        const res: request.Response = await request
            .post(`${functions.config().bolt.url.auth}`)
            .set('Content-Type', 'application/json')
            .send({
                user_name: user,
                user_pass: pass,
            });
        return JSON.parse(res.text).access_token;
    } catch (err) {
        logError(Operator.BOLT, err, 'Failed to refresh session key');
        return Promise.reject();
    }
}

async function getToken(): Promise<string> {
  return refreshBoltToken(
    functions.config().bolt.api.oslo.user,
    functions.config().bolt.api.oslo.pass
  )
}

app.get('/gbfs', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/gbfs', await getToken());
    const response: GBFS = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        en: {
          feeds: [
            {
              name: 'system_information',
              url: `${req.protocol}://${req.hostname}${req.baseUrl}/system_information`
            },
            {
              name: 'vehicle_types',
              url: `${req.protocol}://${req.hostname}${req.baseUrl}/vehicle_types`
            },
            {
              name: 'free_bike_status',
              url: `${req.protocol}://${req.hostname}${req.baseUrl}/free_bike_status`
            },
            {
              name: 'system_regions',
              url: `${req.protocol}://${req.hostname}${req.baseUrl}/system_regions`
            },
            {
              name: 'system_pricing_plans',
              url: `${req.protocol}://${req.hostname}${req.baseUrl}/system_pricing_plans`
            },
          ]
        }
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

app.get('/system_information', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl,
      data: {
        system_id,
        language,
        name,
        url,
        timezone
      }
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/system_information', await getToken());
    const response: SystemInformation = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        system_id: `YBO:System:${system_id}Oslo`,
        language,
        name,
        url,
        timezone
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

app.get('/vehicle_types', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/gbfs', await getToken());
    const response: VehicleTypes = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        vehicle_types: [
          {
            vehicle_type_id: 'YBO:VehicleType:Scooter',
            form_factor: 'scooter',
            propulsion_type: 'electric',
            max_range_meters: 0
          }
        ]
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

app.get('/free_bike_status', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl,
      data
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/free_bike_status', await getToken());
    const response: FreeBikeStatus = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        bikes: [
          data.bikes.map((bike: any) => ({
            bike_id: `YBO:Scooter:${bike.bike_id}`,
            lat: bike.lat,
            lon: bike.lon,
            is_reserved: bike.is_reserved === 1,
            is_disabled: bike.is_disabled === 1,
            vehicle_type_id: 'YBO:VehicleType:Scooter',
            current_range_meters: 0,
            pricing_plan_id: 'YBO:PricingPlan:Basic'
          }))
        ]
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

app.get('/system_regions', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/gbfs', await getToken());
    const response: SystemRegions = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        regions: [
          {
            region_id: 'YBO:Region:Oslo',
            name: 'Oslo'
          }
        ]
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

app.get('/system_pricing_plans', async (req, res): Promise<void> => {
  try {
    const {
      last_updated,
      ttl
    }: any = await boltRequest('https://mds.bolt.eu/gbfs/1/74/gbfs', await getToken());
    const response: SystemPricingPlans = {
      last_updated,
      ttl,
      version: '2.1',
      data: {
        plans: [
          {
            plan_id: 'YBO:PricingPlan:Basic',
            name: 'Basic',
            currency: 'NOK',
            price: 0.0,
            is_taxable: false,
            description: 'Start NOK 0, Per minute 3,50 NOK',
            per_min_pricing: [
              {
                start: boltOsloScooterPrise.startPrice,
                rate: boltOsloScooterPrise.pricePerMinute,
                interval: 1,
              }
            ]
          }
        ]
      }
    }
    res.send(response);
  } catch (e) {
    logError(Operator.BOLT, e)
    res.sendStatus(404)
  }
});

export const boltoslo = functions.region('europe-west1').https.onRequest(app);
