import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
  });

  it('should be created', () => {
    expect(RoleGuard).toBeTruthy();
  });
});
