import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasseioGestaoComponent } from './passeio-gestao.component';

describe('PasseioGestaoComponent', () => {
  let component: PasseioGestaoComponent;
  let fixture: ComponentFixture<PasseioGestaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasseioGestaoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasseioGestaoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
