import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {FirebaseService} from './firebase-config.service';

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
      const {id, contributor, ...retVal} = data;
      return {
        ...retVal,
        contributor: this.userEmail,
      };
    },
    fromFirestore: (snapshot, options):
        DefinitionItem => {
          const data = snapshot.data(options);
          return {...data, id: snapshot.id};
        }
  };


  constructor(public firebaseServices: FirebaseService) {
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
      this.firebaseServices.db.collection('entries')
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
      this.firebaseServices.db.collection('entries')
          .doc(item.id)
          .withConverter(this.definitionConverter)
          .update(item)
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
      this.firebaseServices.db.collection('entries')
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
          this.firebaseServices.db.collection('entries')
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
}
