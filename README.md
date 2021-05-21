# Mobility Functions

The Entur-Mobility app is an api that contains two endpoints.
* `scooters` close to a user-specified location.
* `prices` for mobility services such as scooters and city bikes.

[📒 Official API documentation](https://developer.entur.org/pages-mobility-docs-scooters)

The api runs on `firebase`, in terms of functions, hence the
`firebase`-[CLI](https://firebase.google.com/docs/cli) and the [Google Cloud SDK](https://cloud.google.com/sdk/) are required.

Follow the installation instructions and restart the terminal.

Make sure you are using the correct firebase project, this can be done by running `firebase projects:list` and checking which project is currently in use.
The current project should be `entur-mobility-staging`. If it is not, then switch to it by running `firebase use entur-mobility-staging`

## Run app

First of all, make sure you have version 10 or higher of Node.js installed.

* Install dependencies: `npm install` (npm >= v7.0.0 is required)
* Download config variables: `npm run get-config`
* Build project and start emulator: `npm start`

Now, the app is running on localhost.

## API

The app can live in three different environments, with the following root:
* localhost: `http://localhost:5001/entur-mobility-staging/europe-west1`
* staging: `https://api.staging.entur.io/mobility/v1/`
* production: `https://api.entur.io/mobility/v1`


### Example requests
#### Get scooters close to a specified position:

```
GET http://localhost:5001/entur-mobility-staging/europe-west1/scooters?lat=59.909&lon=10.746
```
with header: `ET-Client-Name: Entur`

#### Get scooter and city bikes prices:
```
http://localhost:5001/entur-mobility-staging/europe-west1/prices
```
with header: `ET-Client-Name: Entur`

## Deploy
Deploy to staging:
```
npm run deploy:staging
```

Deploy to production:
```
npm run deploy:prod
```

### Deploying API proxy to Apigee

Run

```
npm run deploy-apigee <dev|staging|prod>
```

Fill in username and password when prompted.

You need to deploy to dev before deploying to staging or prod.

## Heatmap
in the `public`-folder you can find a simple application showing a heatmap for scooters in Norway.
For the map to be fully functional, you have to edit the html code and add the API-key for google maps.
This key can be found in Google cloud console --> Credentials --> API keys. Pick the "Browser key".

The heatmap runs on `https://entur-mobility-staging.firebaseapp.com/`

Deploy
```
npm run stage-heatmap
```
