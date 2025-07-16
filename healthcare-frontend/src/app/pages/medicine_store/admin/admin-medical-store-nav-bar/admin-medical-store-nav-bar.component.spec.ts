import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMedicalStoreNavBarComponent } from './admin-medical-store-nav-bar.component';

describe('AdminMedicalStoreNavBarComponent', () => {
  let component: AdminMedicalStoreNavBarComponent;
  let fixture: ComponentFixture<AdminMedicalStoreNavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMedicalStoreNavBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminMedicalStoreNavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
