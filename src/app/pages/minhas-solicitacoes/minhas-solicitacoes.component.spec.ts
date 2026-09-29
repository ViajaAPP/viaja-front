import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasSolicitacoesComponent } from './minhas-solicitacoes.component';

describe('MinhasSolicitacoesComponent', () => {
  let component: MinhasSolicitacoesComponent;
  let fixture: ComponentFixture<MinhasSolicitacoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasSolicitacoesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasSolicitacoesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
