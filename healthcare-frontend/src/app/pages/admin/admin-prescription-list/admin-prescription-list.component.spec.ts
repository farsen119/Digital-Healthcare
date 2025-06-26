import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPrescriptionListComponent } from './admin-prescription-list.component';

describe('AdminPrescriptionListComponent', () => {
  let component: AdminPrescriptionListComponent;
  let fixture: ComponentFixture<AdminPrescriptionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPrescriptionListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminPrescriptionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
