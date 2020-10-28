import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDefinitionComponent } from './edit-definition.component';

describe('EditDefinitionComponent', () => {
  let component: EditDefinitionComponent;
  let fixture: ComponentFixture<EditDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditDefinitionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
