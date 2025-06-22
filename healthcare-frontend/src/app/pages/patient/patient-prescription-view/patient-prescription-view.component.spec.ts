import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientPrescriptionViewComponent } from './patient-prescription-view.component';

describe('PatientPrescriptionViewComponent', () => {
  let component: PatientPrescriptionViewComponent;
  let fixture: ComponentFixture<PatientPrescriptionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientPrescriptionViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatientPrescriptionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
