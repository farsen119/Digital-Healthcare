import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacistAddMedicineComponent } from './pharmacist-add-medicine.component';

describe('PharmacistAddMedicineComponent', () => {
  let component: PharmacistAddMedicineComponent;
  let fixture: ComponentFixture<PharmacistAddMedicineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacistAddMedicineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PharmacistAddMedicineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
