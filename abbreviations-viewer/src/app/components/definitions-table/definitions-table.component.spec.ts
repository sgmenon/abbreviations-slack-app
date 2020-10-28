import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DefinitionsTableComponent} from './definitions-table.component';

describe('DefinitionsTableComponent', () => {
  let component: DefinitionsTableComponent;
  let fixture: ComponentFixture<DefinitionsTableComponent>;

  beforeEach(async () => {
    await TestBed
        .configureTestingModule({declarations: [DefinitionsTableComponent]})
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefinitionsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
