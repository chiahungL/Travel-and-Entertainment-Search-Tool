import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
}

// export class AppComponent implements OnInit {
//     title = 'app';
//     results = '';
//     constructor(private http: HttpClient){
//     }
//     ngOnInit(): void {
//       this.http.get('https://api.github.com/users/seeschweiler').subscribe(data => {
//         console.log(data);
//       });
//     }
//   }
