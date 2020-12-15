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

1. Remove the call to `verifyToken` in the function `uploadFromCSV`, in the file `functions\src\index.ts`
1. Restart the emulator (step `1.`)
1. Run this:

    ```sh
    curl -X POST http://localhost:5001/sidmenon-playground/us-central1/uploadFromCSV
    ```
