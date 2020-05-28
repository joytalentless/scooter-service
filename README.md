# Mobility functions

The Entur-Mobility app is an api that contains two endpoints. 
* `scooters` close to a user-specified location. 
* `prices` for mobility services such as scooters and city bikes.


## ./functions

The api runs on `firebase`, in terms of functions, hence the 
`firebase`-[CLI](https://firebase.google.com/docs/cli) and the [Google Cloud SDK](https://cloud.google.com/sdk/) are required.

Follow the installation instructions and restart the terminal.

Make sure you are using the correct firebase project, this can be done by running `firebase projects:list` and checking which project is currently in use.
The current project should be `entur-mobility-staging`. If it is not, then switch to it by running `firebase use entur-mobility-staging`

## Run app

* Install firebase:  
`curl -sL https://firebase.tools | bash`
* Set configs:  
`firebase functions:config:get > .runtimeconfig.json`
* Install correct node version:  
`nvm install 10.20`
* Navigate to functions:  
`cd functions`
* Install dependencies:  
`yarn install`
* Use correct node version:  
`nvm use v10.20`
* Build project and start emulator:  
`yarn start`

Now, the app is running on localhost.

## Api

The app can live in three different environments, with the following root:
* localhost: `http://localhost:5001/entur-mobility-staging/europe-west1`
* staging `https://api.staging.entur.io/mobility/v1/`
* production `https://api.entur.io/mobility/v1`


### Example requests
####Get scooters close to a specified position:

```
GET http://localhost:5001/entur-mobility-staging/europe-west1/scooters?lat=59.909&lon=10.746
```
with header: `ET-Client-Name: Entur`

####Get scooter and city bikes prices:
```
http://localhost:5001/entur-mobility-staging/europe-west1/prices
```
with header: `ET-Client-Name: Entur`

## Deploy
Deploy to staging:
```
yarn stage
``` 

Deploy to production:
```
yarn deploy-prod
```