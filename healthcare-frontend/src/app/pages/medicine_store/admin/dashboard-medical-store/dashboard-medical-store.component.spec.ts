import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMedicalStoreComponent } from './dashboard-medical-store.component';

describe('DashboardMedicalStoreComponent', () => {
  let component: DashboardMedicalStoreComponent;
  let fixture: ComponentFixture<DashboardMedicalStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardMedicalStoreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardMedicalStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
