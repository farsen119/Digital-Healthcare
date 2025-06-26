import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPrescriptionViewComponent } from './admin-prescription-view.component';

describe('AdminPrescriptionViewComponent', () => {
  let component: AdminPrescriptionViewComponent;
  let fixture: ComponentFixture<AdminPrescriptionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPrescriptionViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminPrescriptionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
