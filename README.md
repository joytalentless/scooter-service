# Mobility functions

## ./functions

The `firebase`-[CLI](https://firebase.google.com/docs/cli) and the [Google Cloud SDK](https://cloud.google.com/sdk/) are required.

Follow the installation instructions and restart the terminal.

The following command is useful if you wish to test the functions locally (run it in the root-map):

```
firebase functions:config:get > .runtimeconfig.json
```

Make sure you are using the correct firebase project, this can be done by running `firebase projects:list` and checking which project is currently in use.
The current project should be `entur-mobility-staging`. If it is not, then switch to it by running `firebase use entur-mobility-staging`
