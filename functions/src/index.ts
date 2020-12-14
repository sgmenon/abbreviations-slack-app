import * as csv from 'csvtojson';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

interface DefinitionItem {
  id: string;
  abbreviation: string;
  expansion: string;
  context?: string;
  description?: string;
  usage?: string;
  contributor: string;
}

export const uploadFromCSV =
    functions.https.onRequest(async (request, response) => {
      const csvFileName: string = request.params[0];
      let collectionName = 'entries';
      if (request.query.collection) {
        collectionName = request.query.collection as string;
      }
      const pathReference = storage.bucket().file(`acronyms${csvFileName}.csv`);
      const destFilename = './tmpDownload.csv';
      const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: destFilename
      };
      await pathReference.download(options);
      await csv().fromFile(destFilename).then((jsonValues) => {
        jsonValues.forEach(async jsonValue => {
          await db.collection(collectionName).add(jsonValue as DefinitionItem);
        });
      });
      response.send('Done!');
    });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
