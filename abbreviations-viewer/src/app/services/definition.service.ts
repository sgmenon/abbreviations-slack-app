import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';

import {FirebaseService} from './firebase-config.service';

const ABBREVIATIONS_COLLECTION = 'abbreviations_v0';

interface DefinitionItemInFirestore {
  abbreviationLowerCase: string;
  abbreviation: string;
  expansion: string;
  context?: string;
  description?: string;
  usage?: string;
  contributor: string;
}
export interface DefinitionItem {
  id: string;
  abbreviation: string;
  expansion: string;
  context?: string;
  description?: string;
  usage?: string;
  contributor: string;
}

@Injectable({providedIn: 'root'})
export class DefinitionService {
  private userEmail: string;
  private unsubscribeOnSnapshotFcn: any;
  private definitionConverter = {
    toFirestore: (data: DefinitionItem) => {
      let contributorList = new Set();
      const {id, contributor, ...retVal} = data;
      if (contributor) {
        contributorList = new Set(contributor.split(',').map(e => e.trim()));
      }
      contributorList.add(this.userEmail);
      return {
        ...retVal,
        abbreviationLowerCase:
            data.abbreviation.toLowerCase().toUpperCase().toLowerCase(),
        contributor: [...contributorList].join(', '),
      };
    },
    fromFirestore:
        (snapshot: firebase.default.firestore.QueryDocumentSnapshot,
         options: firebase.default.firestore.SnapshotOptions):
            DefinitionItem => {
              const {abbreviationLowerCase, ...data} =
                  snapshot.data(options) as DefinitionItemInFirestore;
              return {...data, id: snapshot.id};
            }
  };


  constructor(
      public firebaseServices: FirebaseService,
      private httpClient: HttpClient) {
    this.firebaseServices.user.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
      }
    });
  }

  unsubscribeAll() {
    if (this.unsubscribeOnSnapshotFcn) {
      this.unsubscribeOnSnapshotFcn();
    }
  }

  add(item: DefinitionItem) {
    return new Promise((resolve, reject) => {
      this.firebaseServices.db.collection(ABBREVIATIONS_COLLECTION)
          .withConverter(this.definitionConverter)
          .add(item)
          .then((docRef) => {
            resolve(docRef);
          })
          .catch((error) => {
            reject(error);
          });
    });
  }

  update(item: DefinitionItem) {
    return new Promise((resolve, reject) => {
      this.firebaseServices.db.collection(ABBREVIATIONS_COLLECTION)
          .doc(item.id)
          .update(this.definitionConverter.toFirestore(item))
          .then(() => {
            resolve(item.id);
          })
          .catch((error) => {
            reject(error);
          });
    });
  }

  find(name: string): Promise<DefinitionItem[]> {
    return new Promise<DefinitionItem[]>((resolve) => {
      const retVal: DefinitionItem[] = [];
      this.firebaseServices.db.collection(ABBREVIATIONS_COLLECTION)
          .withConverter(this.definitionConverter)
          .where('abbreviation', '==', name)
          .get()
          .then(querySnapshots => {
            querySnapshots.forEach((doc) => {
              if (doc.exists) {
                retVal.push(doc.data());
              }
            });
            resolve(retVal);
          });
    });
  }

  getAll(): Observable<DefinitionItem[]> {
    return new Observable<DefinitionItem[]>(subscriber => {
      this.unsubscribeOnSnapshotFcn =
          this.firebaseServices.db.collection(ABBREVIATIONS_COLLECTION)
              .withConverter(this.definitionConverter)
              .onSnapshot(querySnapshots => {
                const retVal: DefinitionItem[] = [];
                querySnapshots.forEach((doc) => {
                  if (doc.exists) {
                    retVal.push(doc.data());
                  }
                });
                subscriber.next(retVal);
              });
    });
  }

  async downloadCSV(entries: DefinitionItem[]) {
    const downloadFilename = `snapshot_${new Date().getTime()}.csv`;
    const fields = [
      'abbreviation', 'expansion', 'context', 'description', 'usage',
      'contributor'
    ];
    const getValue = (item: DefinitionItem, fieldName: string) => {
      if (!item[fieldName]) {
        return '';
      }
      let retVal: string = item[fieldName];
      if (retVal.search(/\W/)) {
        retVal = `"${retVal}"`;
      }
      return retVal;
    };
    let value = fields.join(',');
    value += '\n';
    entries.forEach(entry => {
      const [id, ...data] = entries;
      value += (fields.map((fieldName: string) => getValue(entry, fieldName)))
                   .join(',');
      value += '\n';
    });
    const download = (filename, text) => {
      const element = document.createElement('a');
      element.setAttribute(
          'href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };
    download(downloadFilename, value);
  }

  async uploadCSV(filename: string) {
    const user = this.firebaseServices.user.getValue();
    if (user) {
      const headers =
          new HttpHeaders({Authorization: `Bearer ${await user.getIdToken()}`});
      return this.httpClient.post(
          `${environment.uploadFromCSVURL}/${filename.replace(/\.csv$/gi, '')}`,
          '', {headers});
    }
  }
}
