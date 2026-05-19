import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent implements OnInit {

  ngOnInit(): void {
    console.log('LoadingComponent initialized');
  }

}
