import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasseioFormComponent } from './passeio-form.component';

describe('PasseioFormComponent', () => {
  let component: PasseioFormComponent;
  let fixture: ComponentFixture<PasseioFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasseioFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasseioFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
