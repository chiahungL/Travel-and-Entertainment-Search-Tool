import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; //test
import { HttpClientModule } from '@angular/common/http'; //test

import { AppComponent } from './app.component';
import { SearchFormComponent } from './search-form/search-form.component';

import { AgmCoreModule } from '@agm/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    AppComponent,
    SearchFormComponent
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    FormsModule, //test
    ReactiveFormsModule, //test
    HttpClientModule,
    //test
    AgmCoreModule.forRoot({
        apiKey: "AIzaSyCRN8JExWAfJ7Cqg8eMVGIrK-13UMbAS-0",
        libraries: ["places"]
    }),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
