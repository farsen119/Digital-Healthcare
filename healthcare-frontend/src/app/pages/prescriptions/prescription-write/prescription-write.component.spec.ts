import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionWriteComponent } from './prescription-write.component';

describe('PrescriptionWriteComponent', () => {
  let component: PrescriptionWriteComponent;
  let fixture: ComponentFixture<PrescriptionWriteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionWriteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrescriptionWriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
