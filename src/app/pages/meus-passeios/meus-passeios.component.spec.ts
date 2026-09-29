import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusPasseiosComponent } from './meus-passeios.component';

describe('MeusPasseiosComponent', () => {
  let component: MeusPasseiosComponent;
  let fixture: ComponentFixture<MeusPasseiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusPasseiosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusPasseiosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
