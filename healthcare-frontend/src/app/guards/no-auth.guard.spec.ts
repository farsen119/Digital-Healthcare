import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoAuthGuard } from './no-auth.guard';

describe('NoAuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
  });

  it('should be created', () => {
    expect(NoAuthGuard).toBeTruthy();
  });
});
