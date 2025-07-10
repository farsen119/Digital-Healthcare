import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicineStoreComponent } from './medicine-store.component';

describe('MedicineStoreComponent', () => {
  let component: MedicineStoreComponent;
  let fixture: ComponentFixture<MedicineStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicineStoreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicineStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
