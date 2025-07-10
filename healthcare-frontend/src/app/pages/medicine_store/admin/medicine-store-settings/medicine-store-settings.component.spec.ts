import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicineStoreSettingsComponent } from './medicine-store-settings.component';

describe('MedicineStoreSettingsComponent', () => {
  let component: MedicineStoreSettingsComponent;
  let fixture: ComponentFixture<MedicineStoreSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicineStoreSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicineStoreSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
