import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../services/feedback/feedback.service';

@Component({
  selector: 'app-aviso',
  templateUrl: './aviso.component.html',
  styleUrl: './aviso.component.scss',
})
export class AvisoComponent {
  readonly feedback = inject(FeedbackService);
}
