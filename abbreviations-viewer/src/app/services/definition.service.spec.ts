import {TestBed} from '@angular/core/testing';

import {DefinitionService} from './definition.service';
import {FirebaseService} from './firebase-config.service';

class FireBaseServiceMock {
  db = {collections: [] as Array<any>};
}

describe('DefinitionServiceService', () => {
  let service: DefinitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{provider: FirebaseService, useClass: FireBaseServiceMock}]
    });
    service = TestBed.inject(DefinitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
