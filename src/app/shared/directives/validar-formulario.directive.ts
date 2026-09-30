import { Directive, ElementRef, inject } from '@angular/core';
import { NgForm } from '@angular/forms';

@Directive({
  selector: 'form[appValidarFormulario]',
  host: { '(submit)': 'aoEnviar()' },
})
export class ValidarFormularioDirective {
  private readonly form = inject(NgForm);
  private readonly elemento = inject<ElementRef<HTMLFormElement>>(ElementRef);

  aoEnviar(): void {
    if (this.form.valid) return;
    setTimeout(() => {
      const campo = this.elemento.nativeElement.querySelector<HTMLElement>(
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid'
      );
      campo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      campo?.focus({ preventScroll: true });
    });
  }
}
