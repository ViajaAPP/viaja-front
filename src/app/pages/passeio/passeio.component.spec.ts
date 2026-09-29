import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasseioComponent } from './passeio.component';

describe('PasseioComponent', () => {
  let component: PasseioComponent;
  let fixture: ComponentFixture<PasseioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasseioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasseioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
