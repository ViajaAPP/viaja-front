import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosCliente } from './dados-cliente';

describe('DadosCliente', () => {
  let component: DadosCliente;
  let fixture: ComponentFixture<DadosCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
