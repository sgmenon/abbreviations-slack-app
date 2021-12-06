# Abbreviations Viewer & Slack App
Slack app and Web GUI for expanding abbreviations used within an organization

Web App deployed at : [motional-whatis.web.app](https://motional-whatis.web.app) (currently restricted to users with verified @motional.com email IDs) 


Others are welcome to adapting this code base to their own firebase projects (just be sure to change all references to the firebase project, for example, in firebase.json).

## 0. One time Setup

Download:
- Node Js, perferably using [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
- install the firebase-tools package. (eg. `npm install -g firebase-tools`)
- install the angular-cli package. (eg. `npm install -g @angular/cli`)

## 1. Start emulator

Setup for functions

```sh
firebase login
firebase functions:config:get > funcions/.runtimeconfig.json
```

For debugging:

```sh
firebase emulators:start --inspect-functions
```

Debug following [these instructions](https://nodejs.org/en/docs/guides/debugging-getting-started/)

Without debugging needs:

```sh
firebase emulators:start
```

## 2. Viewing the website with the live Firestore db

```sh
firebase serve
```

Now visit `localhost:5000`


## 3. Viewing the website with the emulated Firestore db

### 3.1 Create credentials for serving locally without `firebase serve`


In the sub-folder `abbreviations-viewer`, create a file named `firebase-config.ts`.

[Obtain the Firebase config object](https://support.google.com/firebase/answer/7015592) for this firebase project, and use that file to populate an exported constant named `firebaseConfig` in this typescript file.

The file should look like this:

```ts
/** Firebase config needed for accessing the firebase app */
export const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  measurementId: "G-MEASUREMENT_ID",
};
```

### 3.2 Start a local, debug-able front-end Angular application

Run the steps in section `1`. Then run:

```sh
cd abbreviations-viewer
ng serve
```

Now visit `localhost:4200`


If you just started the emulator, there won't be any data. To seed this with real data (using the December 2020 snapshot of the app) do this:

1. Visit `http://localhost:4200/main?admin=1`
1. Click the upload button use the snapshot: `snapshot_1607451754712.csv`. Then hit "Ok".

## 4. Deploying the app

Firebase hosting is deployment is done automatically when PRs are merged.

Manual deployment (and deployment of functions, storage rules etc.) may be done if you have required permissions, using the following command:

```sh
firebase deploy
```

## 5. Slack integration

Create a slack app, with a slash command that points to the URL of the cloud function "slackWhatIsRequest".

Make sure to have the following oauth scopes `chat:write`, `chat:write.customize`, `commands` and `im:write`.

Install this newly created app to your Slack workspace, and be sure to set the following firebase:config options

```sh
firebase functions:config:set slack.signing_secret=<app-signing-secret> slack.app_id=<your_app_id> slack.bot_token=<bot-oauth-token>
```

Redeploy functions (`firebase deploy --only functions`), and test it out on your slack workspace!
