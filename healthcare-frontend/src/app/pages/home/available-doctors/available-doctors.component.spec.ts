import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableDoctorsComponent } from './available-doctors.component';

describe('AvailableDoctorsComponent', () => {
  let component: AvailableDoctorsComponent;
  let fixture: ComponentFixture<AvailableDoctorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableDoctorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AvailableDoctorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
