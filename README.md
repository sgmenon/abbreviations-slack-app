# abbreviations-slack-app
Slack app and Web GUI for expanding abbreviations used within an organization


## 1. Start emulator

For debugging:

```sh
firebase emulators:start --inspect-functions
```

Without debugging needs:

```sh
firebase emulators:start --inspect-functions
```

## 2. Viewing the app with the live Firestore db

```sh
firebase serve
```

Now visit `localhost:5000`


## 3. Viewing the app with the emulated Firestore db

Run the steps in section `1`. Then run:

```sh
cd abbreviations-viewer
ng serve
```

Now visit `localhost:4200`


If you just started the emulator, there won't be any data. To seed this with real data (using the December 2020 snapshot of the app) do this:

1. Visit `http://localhost:4200/main?admin=1`
1. Click the upload button and you can use the snapshot: `snapshot_1607451754712.csv`.

## 4. Deploying the app

Firebase hosting is deployment is done automatically when PRs are merged.

Manual deployment (and deployment of functions, storage rules etc.) may be done if you have required permissions, using the following command:

```sh
firebase deploy
```
