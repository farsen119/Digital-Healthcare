import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBookAppointmentComponent } from './admin-book-appointment.component';

describe('AdminBookAppointmentComponent', () => {
  let component: AdminBookAppointmentComponent;
  let fixture: ComponentFixture<AdminBookAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookAppointmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminBookAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
