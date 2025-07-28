import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StockHistoryService } from './stock-history.service.service';

describe('StockHistoryService', () => {
  let service: StockHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StockHistoryService]
    });
    service = TestBed.inject(StockHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
