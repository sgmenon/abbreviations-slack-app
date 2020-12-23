import {PubSub} from '@google-cloud/pubsub'
import {WebClient} from '@slack/web-api';
import * as cors from 'cors';
import * as crypto from 'crypto';
import * as csv from 'csvtojson';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as qs from 'qs';

const corsRequest = cors({origin: true});
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const ADMIN = 'siddharth.menon@motional.com';
const bot = new WebClient(functions.config().slack.token);
const pubsubClient = new PubSub();
const ABBREVIATIONS_COLLECTION = 'abbreviations_v0';

interface DefinitionItem {
  abbreviationLowerCase: string;
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

const legitSlackRequest = (req: functions.https.Request) => {
  // Your signing secret
  const slackSigningSecret = functions.config().slack.signing_secret as string;

  // Grab the signature and timestamp from the headers
  const requestSignature = req.headers['x-slack-signature'] as string;
  const requestTimestamp = req.headers['x-slack-request-timestamp'] as string;


  // Update it with the Slack Request
  const [version, hash] = requestSignature.split('=');
  const signatureBaseString = `${version}:${requestTimestamp}:${
      qs.stringify(req.body, {format: 'RFC1738'})}`;
  const mySignature = crypto.createHmac('sha256', slackSigningSecret)
                          .update(signatureBaseString, 'utf8')
                          .digest('hex');

  // Returns true if it matches
  return crypto.timingSafeEqual(
      Buffer.from(hash, 'utf8'), Buffer.from(mySignature, 'utf-8'));
};

/**
 * Authenticate users based on
 * https://cloud.google.com/endpoints/docs/openapi/authenticating-users-google-id
 */
const verifyAdminToken =
    async(request: functions.Request): Promise<boolean> => {
  try {
    const token: string|undefined = await getToken(request);

    if (!token) {
      return false;
    }

    return await admin.auth().verifyIdToken(token).then(async decodedToken => {
      const uid = decodedToken.uid;
      const userInfo = await admin.auth().getUser(uid);
      return (userInfo.email === ADMIN && userInfo.emailVerified);
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
      const destFilename = '/tmp/tmpDownload.csv';
      try {
        if (!await verifyAdminToken(request)) {
          response.status(403).send('User not authorized to make this request');
          return;
        }
        const csvFileName: string = request.params[0];
        let collectionName = ABBREVIATIONS_COLLECTION;
        if (request.query.collection) {
          collectionName = request.query.collection as string;
        }
        const pathReference =
            storage.bucket().file(`acronyms${csvFileName}.csv`);
        if (!pathReference.exists()) {
          response.status(404).send(JSON.stringify(`A file named '${
              csvFileName}.csv' was not found in this app's default storage bucket.`));
          return;
        }
        const options = {destination: destFilename};
        await pathReference.download(options);
        await csv().fromFile(destFilename).then((jsonValues) => {
          jsonValues.forEach(async jsonValue => {
            if (!jsonValue.hasOwnProperty('abbreviationLowerCase')) {
              jsonValue['abbreviationLowerCase'] =
                  (jsonValue.abbreviation as string)
                      .toLowerCase()
                      .toUpperCase()
                      .toLowerCase();
            }
            await db.collection(collectionName)
                .add(jsonValue as DefinitionItem);
          });
        });
        response.send(JSON.stringify('Done!'));
      } catch (error) {
        response.status(500).send(JSON.stringify(error));
      }
      try {
        fs.unlinkSync(destFilename);
      } catch (error) {
        functions.logger.info(`error deleting file ${destFilename}`);
      }
    }));

/**
 * Function called by slack api /whatis
 */
export const slackWhatIsRequest = functions.https.onRequest(
    (request, response) => corsRequest(request, response, async () => {
      try {
        const legit = legitSlackRequest(request);
        if (!legit) {
          response.status(403).send(
              'Nice try buddy. Slack signatures mismatch.');
          return;
        }
        if (request.body.api_app_id !== functions.config().slack.app_id) {
          response.status(403).send('Only one slack app can call this API.');
          return;
        }
        const data = JSON.stringify(request.body);
        const dataBuffer = Buffer.from(data);

        await pubsubClient.topic('whatis').publisher.publish(dataBuffer);
        response.status(200).send();
      } catch (error) {
        response.status(500).send(JSON.stringify(error));
      }
    }));

export const whatIs = functions.pubsub.topic('whatis').onPublish(
    async (message, pubSubContext) => {
      const {text, channel_id, user_id} = message.json;
      const queryResult =
          await db.collection(ABBREVIATIONS_COLLECTION)
              .where(
                  'abbreviationLowerCase', '==',
                  (text.toLowerCase().toUpperCase().toLowerCase() as string)
                      .trim())
              .get();
      let resultString = '';
      let expansion = '';
      if (queryResult.size === 0) {
        resultString = `No abbreviation was found for '${
            (text as string)
                .trim()}'.\nWhen you find out what it stands for considering adding it to our list by visiting <https://motional-whatis.web.app>`
      } else {
        queryResult.docs.forEach(doc => {
          const abbreviation = doc.get('abbreviation');
          if (abbreviation) {
            expansion = doc.get('expansion');
            let description: string = doc.get('description')
            if (description) {
              description = `Description: ${description} \n`;
            }
            let contributor: string = doc.get('contributor')
            if (contributor) {
              contributor = `Contributed by _${contributor}_ \n`;
            }
            let context: string = doc.get('context')
            if (context) {
              context = `Context: ${context} \n`;
            }
            resultString += `*${abbreviation}*: ${expansion}\n ${
                context + description + contributor}`;
          }
        });
      }
      const conversationInfo = await bot.conversations.open(
          {token: functions.config().slack.bot_token, users: user_id});
      let finalChannelId = channel_id;
      if (conversationInfo) {
        finalChannelId = (conversationInfo as any).channel.id;
      }
      bot.chat
          .postEphemeral({
            token: functions.config().slack.bot_token,
            attachments: [],
            text: expansion,
            blocks: [{
              'type': 'section',
              'text': {'type': 'mrkdwn', 'text': resultString}
            }],
            channel: finalChannelId,
            user: user_id,
            username: 'Motional What-Is',
            icon_emoji: ':go_motional:'
          })
          .then(
              (status) => {
                functions.logger.info(status);
              },
              (error) => {
                functions.logger.info('Failure!', error);
              });
    });