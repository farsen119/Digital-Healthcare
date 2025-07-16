import { TestBed } from '@angular/core/testing';

import { StockHistoryServiceService } from './stock-history.service.service';

describe('StockHistoryServiceService', () => {
  let service: StockHistoryServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockHistoryServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
