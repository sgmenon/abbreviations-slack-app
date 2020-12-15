import * as cors from 'cors';
import * as csv from 'csvtojson';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as fs from 'fs';

const corsRequest = cors({origin: true});
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

const getToken =
    async(request: functions.Request): Promise<string|undefined> => {
  if (!request.headers.authorization) {
    return undefined;
  }

  const token: string = request.headers.authorization.replace(/^Bearer\s/, '');

  return token;
};

/**
 * Authenticate users based on
 * https://cloud.google.com/endpoints/docs/openapi/authenticating-users-google-id
 */
const verifyToken = async(request: functions.Request): Promise<boolean> => {
  try {
    const token: string|undefined = await getToken(request);

    if (!token) {
      return false;
    }

    return await admin.auth().verifyIdToken(token).then(async decodedToken => {
      const uid = decodedToken.uid;
      const userInfo = await admin.auth().getUser(uid);
      return (
          userInfo.email === 'siddharth.menon@motional.com' &&
          userInfo.emailVerified);
    });
  } catch (err) {
    return false;
  }
};

/**
 * call using:
 * curl -X POST -H "Authorization: Bearer $(getAccessToken)"
 \
              http://localhost:5001/sidmenon-playground/us-central1/uploadFromCSV/snapshot_1607451754712
 */
export const uploadFromCSV = functions.https.onRequest(
    (request, response) => corsRequest(request, response, async () => {
      try {
        if (!await verifyToken(request)) {
          response.sendStatus(403);
          return;
        }
        const csvFileName: string = request.params[0];
        let collectionName = 'entries';
        if (request.query.collection) {
          collectionName = request.query.collection as string;
        }
        const pathReference =
            storage.bucket().file(`acronyms${csvFileName}.csv`);
        if (!pathReference.exists()) {
          response.sendStatus(404);
          return;
        }
        const destFilename = './tmpDownload.csv';
        const options = {
          // The path to which the file should be downloaded, e.g. "./file.txt"
          destination: destFilename
        };
        await pathReference.download(options);
        await csv().fromFile(destFilename).then((jsonValues) => {
          jsonValues.forEach(async jsonValue => {
            await db.collection(collectionName)
                .add(jsonValue as DefinitionItem);
          });
        });
        fs.unlinkSync(destFilename);
      } catch (error) {
        response.sendStatus(500);
      }
      response.send('Done!');
    }));

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
