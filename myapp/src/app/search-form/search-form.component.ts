import { Component, OnInit, ElementRef, NgZone, ViewChild } from '@angular/core';

import { InputSet } from '../input-set';

import { HttpClient } from '@angular/common/http';

import { FormControl } from '@angular/forms';
import { } from '@types/googlemaps';
import { MapsAPILoader } from '@agm/core';
// import 'rxjs/add/operator/map';

import * as moment from 'moment';

import { trigger, style, transition, animate, group } from '@angular/animations';


@Component({
    selector: 'app-search-form',
    templateUrl: './search-form.component.html',
    styleUrls: ['./search-form.component.css'],
    animations: [
        trigger('searchListAnimation', [
            transition('in => out', [
                style({transform: 'translateX(-100%)'}),
                animate(500)
            ]),
            transition('out => in', [
                style({transform: 'translateX(100%)'}),
                animate(500)
            ])
        ]),
        trigger('detailsAnimation', [
            transition('in => out', [
                style({transform: 'translateX(100%)'}),
                animate(500)
            ]),
            transition('out => in', [
                style({transform: 'translateX(-100%)'}),
                animate(500)
            ])
        ]),
        trigger('reviewsAnimation', [
            transition('dummyFadeIn => fadeIn', [
                style({ opacity: 0 }),
                animate(1000, style({ opacity: 1 }))
            ]),
            transition('fadeIn => dummyFadeIn', [
                style({ opacity: 0 }),
                animate(1000, style({ opacity: 1 }))
            ])
        ])
    ]
})


export class SearchFormComponent {

    constructor(private http: HttpClient, private mapsAPILoader: MapsAPILoader, private zone: NgZone){ //auto complete test
    }

    categories = [
        {display: 'Default', value: 'default'},
        {display: 'Airport', value: 'airport'},
        {display: 'Amusement Park', value: 'amusement_park'},
        {display: 'Aquarium', value: 'aquarium'},
        {display: 'Art Gallery', value: 'art_gallery'},
        {display: 'Bakery', value: 'bakery'},
        {display: 'Bar', value: 'bar'},
        {display: 'Beauty Salon', value: 'beauty_salon'},
        {display: 'Bowling Alley', value: 'bowling_alley'},
        {display: 'Bus Station', value: 'bus_station'},
        {display: 'Cafe', value: 'cafe'},
        {display: 'Campground', value: 'campground'},
        {display: 'Car Rental', value: 'car_rental'},
        {display: 'Casino', value: 'casino'},
        {display: 'Lodging', value: 'lodging'},
        {display: 'Movie Theater', value: 'movie_theater'},
        {display: 'Museum', value: 'museum'},
        {display: 'Night Club', value: 'night_club'},
        {display: 'Park', value: 'park'},
        {display: 'Parking', value: 'parking'},
        {display: 'Restaurant', value: 'restaurant'},
        {display: 'Shopping Mall', value: 'shopping_mall'},
        {display: 'Stadium', value: 'stadium'},
        {display: 'Subway Station', value: 'subway_station'},
        {display: 'Taxi Stand', value: 'taxi_stand'},
        {display: 'Train Station', value: 'train_station'},
        {display: 'Transit Station', value: 'transit_station'},
        {display: 'Travel Agency', value: 'travel_agency'},
        {display: 'Zoo', value: 'zoo'}
    ]


    model = new InputSet('', this.categories[0], '', '');

    selectedOption = this.categories[0];
    submitted = false;
    submitWithEmptyLocText = false;
    currentBtn = true;
    otherBtn = false;
    latitude = 0;
    longitude = 0;
    currLat = 0;
    currLng = 0;
    alreadyGetCurrentLoc = false;
    loading = false;
    gotNearbyData = false;
    gotZeroResult = false;
    gotFailedSearch = false;
    public result: Object;
    // control pagination
    showFirstPage = false;
    showSecondPage = false;
    showThirdPage = false;

    // favorite
    showFavorite = false;
    favoriteList = []; // used to keep the order of different places
    lenOfFavoriteList = 0;
    favoriteListDict = {}; // used to check if the star should be orange, i.e. whether in favorite. {someid: boolean}
    displayFavoriteList = []; // only contain up to 20 places
    currentFavoritePage = 0;
    favoritePageButton = '';

    autoComplete = false;
    autoCompleteResult = '';

    public rowDetails: google.maps.places.PlaceResult;
    public detailsReady = false;
    showDetails = false;
    showTab = 'info';
    currentPage = '';
    currentRow = -1;
    currentSelectedId = '';

    twitterUrl = '';

    // info tab
    ratingPercentage = 0;
    ratingBaseColor = '';
    mouseInRatingRow = false;
    openHourList = [];
    todayHour = '';

    // reviews tab
    currentReviewsSource = 'Google Reviews';
    currentReviewsOrder = 'Default Order';
    reviewsTimeArray = [];
    reviewsObjectArray = [];
    yelpReviewsObjArray = [];

    // map tab
    from = 'Your location';
    travelMode = 'DRIVING';
    nameAndAddress = '';
    fromLatInMapTab = 999;
    fromLngInMapTab = 999;

    // animation
    searchListAnimState = 'in';
    detailsAnimState = 'out';
    reviewsAnimState = 'dummyFadeIn';

    // photo
    photoCol0 = [];
    photoCol1 = [];
    photoCol2 = [];
    photoCol3 = [];

    @ViewChild("locText2")
    public searchElementRef: ElementRef;

    @ViewChild("serviceHelper")
    public helperElementRef: ElementRef;

    @ViewChild("myMap")
    public myMapElementRef: ElementRef;
    map: any;
    marker: any;
    directionsDisplay: any;
    directionsService: any;
    panorama: any;
    togglePanorama = false;

    @ViewChild("fromText")
    public fromTextElementRef: ElementRef;

    @ViewChild("panel")
    public panelElementRef: ElementRef;

    @ViewChild("pegman")
    public pegmanElementRef: ElementRef;



    ngOnInit() {
        this.getCurrentLoc();

        this.lenOfFavoriteList = localStorage.length;
        for (var i = this.lenOfFavoriteList - 1; i >= 0 ; i--) {
            var key = localStorage.key(i);
            this.favoriteListDict[key] = true;
            this.favoriteList.push(JSON.parse(localStorage.getItem(localStorage.key(i))));
        }
    }

    onSubmit() {
        this.submitted = true;
        this.loading = true;
        console.log("submitted---------");
        console.log("keyword = " + this.model.keyword);
        console.log("category = " + this.model.category.value);
        console.log("distance = " + this.model.distance);
        console.log("location = " + this.model.locText);
        console.log(this.categories);
        console.log("====================");
        // SET UP LATETUDE AND LONITUDE, CHECK IF WE NEED TO CALL GEOCODING API
        if (this.currentBtn) {
            var action = "getCurrentLoc";
        } else {
            // call the google geocoding api to get latitude and longtitude
            if (this.model.locText == null || this.model.locText.trim() === '') {
                console.log("the locText is empty or full of space");
                this.submitWithEmptyLocText = true;
                return
            }
            var action = "getOtherLoc";
        }
        var keyword = this.model.keyword.split(' ').join('+');
        console.log(keyword);
        var category = this.model.category.value;
        console.log("==in submit==");
        console.log("this.model.category = " + this.model.category);
        console.log("this.model.category.value = " + this.model.category.value);
        console.log("this.model.category.display = " + this.model.category.display);
        if (this.model.distance == '') {
            var radius = 10 * 1609.34;
        } else {
            var radius = parseFloat(this.model.distance) * 1609.34;
        }

        if (this.autoComplete) {
            var locText = this.autoCompleteResult.split(' ').join('+');
        } else {
            var locText = this.model.locText.split(' ').join('+');
        }

        // TODO: recover latter
        // var urlToServer = "http://localhost:8081/?action=" + action +
        //                 "&keyword=" + keyword + "&category=" + category +
        //                 "&radius=" + radius + "&locText=" + locText +
        //                 "&lat=" + this.latitude + "&lng=" + this.longitude;
        var urlToServer = "http://csci571-2-env.us-east-2.elasticbeanstalk.com/?action=" + action +
                        "&keyword=" + keyword + "&category=" + category +
                        "&radius=" + radius + "&locText=" + locText +
                        "&lat=" + this.latitude + "&lng=" + this.longitude;

        this.callServer(urlToServer);

        console.log("3");
        console.log("lat =", this.latitude);
        console.log("lng = ", this.longitude);


    }

    disableLocBox() {
        this.currentBtn = true;
        this.otherBtn = false;
        this.model.locText = '';
    }

    enableLocBox() {
        this.currentBtn = false;
        this.otherBtn = true;

        // ADDRESS AUTO COMPLETE
        this.mapsAPILoader.load().then(() => {
            let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
                types: ["address"]
            });
            autocomplete.addListener("place_changed", () => {
                let place: google.maps.places.PlaceResult = autocomplete.getPlace();
                console.log("--autocomplete--");
                console.log(place.geometry.location.lat());
                console.log(place.geometry.location.lng());
                console.log(place);
                this.autoComplete = true;
                this.autoCompleteResult = place.geometry.location.toUrlValue(4);
            });
        });

        
    }

    formReset() {
        console.log("===in formReset()===");
        console.log(this.model);
        console.log(this.selectedOption);
        console.log("check this.selectedOption:");
        console.log(this.selectedOption.display);
        console.log(this.selectedOption.value);
        console.log(this.categories);

        this.model.keyword = '';
        this.model.distance = '';
        this.currentBtn = true;
        this.otherBtn = false;
        this.model.locText = '';
        this.submitted = false;
        this.submitWithEmptyLocText = false;
        this.getCurrentLoc();
        this.gotNearbyData = false;
        this.gotZeroResult = false;
        this.gotFailedSearch = false;
        // control pagination
        this.showFirstPage = false;
        this.showSecondPage = false;
        this.showThirdPage = false;

        this.showFavorite = false;

        this.autoComplete = false;
        this.autoCompleteResult = '';

        this.detailsReady = false;
        this.showDetails = false;
        this.showTab = 'info';
        this.currentPage = '';
        this.currentRow = -1;
        this.currentSelectedId = '';
        this.ratingPercentage = 0;
        this.ratingBaseColor = '';
        this.mouseInRatingRow = false;

        // reviews tab
        this.currentReviewsSource = 'Google Reviews';
        this.currentReviewsOrder = 'Default Order';
        this.reviewsTimeArray = [];
        this.reviewsObjectArray = []
        this.yelpReviewsObjArray = [];

        // map tab
        this.from = 'Your location';
        this.travelMode = 'DRIVING';
        this.nameAndAddress = '';
        this.fromLatInMapTab = 999;
        this.fromLngInMapTab = 999;

        // animation
        this.searchListAnimState = 'in';
        this.detailsAnimState = 'out';
        this.reviewsAnimState = 'dummyFadeIn';

        console.log("-------------------");
        console.log(this.model);
        console.log(this.selectedOption);
        console.log("check this.selectedOption:");
        console.log(this.selectedOption.display);
        console.log(this.selectedOption.value);
        console.log(this.categories);

    }

    // CALL IP-API
    getCurrentLoc() {
        this.http.get('http://ip-api.com/json').subscribe(data => {
            this.latitude = data['lat'];
            this.longitude = data['lon'];
            this.currLat = data['lat'];
            this.currLng = data['lon'];
            console.log("===In getCurrentLoc()===");
            console.log(this.latitude);
            console.log(this.longitude);
            this.alreadyGetCurrentLoc = true;
        });
    }

    // CALL THE BACKEND SERVER
    callServer(urlToServer) {
        console.log("==In callServer()==");
        console.log(urlToServer);
        this.http.get(urlToServer).subscribe(data => {
            console.log(data);
            this.loading = false;
            if (!data) {
                this.gotZeroResult = true;
            } else if (data['page0']['status'] == "OK") {
                this.gotNearbyData = true;
                console.log("the status is ok");
                console.log(this.gotNearbyData);
                this.result = data;
                this.goToFirstPage();
            } else if (data['page0']['status'] == "ZERO_RESULTS") {
                this.gotZeroResult = true;
            } else {
                this.gotFailedSearch = true;
            }
        });
    }

    // CONFIG PAGINATION
    goToFirstPage() {
        this.showFirstPage = true;
        this.showSecondPage = false;
        this.showThirdPage = false;
    }

    // CONFIG PAGINATION
    goToSecondPage() {
        this.showFirstPage = false;
        this.showSecondPage = true;
        this.showThirdPage = false;
    }

    // CONFIG PAGINATION
    goToThirdPage() {
        this.showFirstPage = false;
        this.showSecondPage = false;
        this.showThirdPage = true;
    }

    // RESULT/FAVORITE
    enableResult() {
        this.showFavorite = false;
    }

    // RESULT/FAVORITE
    enableFavorite() {
        this.showFavorite = true;

        this.lenOfFavoriteList = this.favoriteList.length;

        console.log("==in enableFavorite()==")
        console.log(this.favoriteList);
        console.log(this.lenOfFavoriteList);

        // handle pagination
        this.displayFavoriteList = [];
        for (var i = this.currentFavoritePage * 20; i < Math.min(this.lenOfFavoriteList, (this.currentFavoritePage + 1) * 20); i++) {
            this.displayFavoriteList.push(this.favoriteList[i]);
        }
        console.log(this.displayFavoriteList);
        if (this.currentFavoritePage == 0 && this.lenOfFavoriteList <= 20) {
            this.favoritePageButton = '';
        } else if (this.currentFavoritePage == 0 && this.lenOfFavoriteList > 20) {
            this.favoritePageButton = 'next';
        } else if (this.currentFavoritePage == Math.floor(this.lenOfFavoriteList / 20)) {
            this.favoritePageButton = 'previous';
        } else {
            this.favoritePageButton = 'previousAndNext';
        }

    }

    goToNextFavorite() {
        this.currentFavoritePage += 1;
        this.enableFavorite();
    }

    goToPreviousFavorite() {
        this.currentFavoritePage -= 1;
        this.enableFavorite();
    }

    // THE DETAIL BUTTON IS CLICKED, PREPARE THE URL
    goGetDetails(page: string, i: number, place_id: string) { // note: the type should be 'string' and 'number', not 'String' and 'Number'.
        // console.log("clicked: page = " + page + " index = " + i);
        // console.log(this.result[page].results[0]);
        // console.log(this.result[page].results[i]);

        this.mapsAPILoader.load().then(() => {
            var request = {
                // placeId: this.result[page].results[i].place_id
                placeId: place_id
            };
            let service = new google.maps.places.PlacesService(this.helperElementRef.nativeElement);
            console.log("--in this.mapsAPILoader--");
            service.getDetails(request, (place, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    const result: google.maps.places.PlaceResult = place;
                    console.log("--In service.getDetails(), the status is ok--");
                    this.rowDetails = result;
                    // THE VARIABLES NEED TO BE SET INSIDE THE ZONE, OTHERWISE THE HTML WON'T DETECT THE UPDATE
                    this.zone.run(() => {
                        this.detailsReady = true;
                        this.currentPage = page; // memorize the current page
                        this.currentRow = i; // memorize the current row
                        this.currentSelectedId = this.rowDetails.place_id;
                        // this.showFirstPage = false;                                  
                        // this.showSecondPage = false;
                        // this.showThirdPage = false;
                        // this.showFavorite = false;
                        this.showDetails = true;
                        this.showTab = 'info';
                        this.currentReviewsSource = 'Google Reviews';
                        this.currentReviewsOrder = 'Default Order';

                        if (this.currentBtn) {
                            this.from = 'Your location';
                        } else {
                            this.from = this.searchElementRef.nativeElement.value;
                        }
                        this.travelMode = 'DRIVING';
                        this.nameAndAddress = this.rowDetails.name + ', ' +this.rowDetails.formatted_address;

                        // prepare the rating
                        if (this.rowDetails.rating) {
                            this.ratingPercentage = (1 - this.rowDetails.rating / 5) * 100;

                            // check rowIndex (base color will be different since using 'strip')
                            var rowIndex = 0;
                            if (this.rowDetails.formatted_address) {
                                rowIndex += 1;
                            }
                            if (this.rowDetails.international_phone_number) {
                                rowIndex += 1;
                            }
                            if (this.rowDetails.price_level) {
                                rowIndex += 1;
                            }
                            // the base color is (242, 242, 242)
                            if (rowIndex % 2 == 0) {
                                this.ratingBaseColor = "rgb(242, 242, 242)";
                            } else {
                                this.ratingBaseColor = "white";
                            }
                        }

                        // prepare the open hour list
                        if (this.rowDetails.opening_hours) {
                            this.openHourList = [];
                            var openHourDict = {}; // key = dayOfWeek, value = openHour time
                            var offsetHour = this.rowDetails.utc_offset / 60;
                            var destinationLocalTime = moment.utc().add(offsetHour, 'hours');
                            var firstDay = moment(destinationLocalTime).format('dddd');
                            console.log("firstDay = ", firstDay);

                            // prepare openHourDict
                            for (var i = 0; i < 7; i++) {
                                var dayOfWeek = this.rowDetails.opening_hours.weekday_text[i].split(': ')[0];
                                var openHour = this.rowDetails.opening_hours.weekday_text[i];
                                openHourDict[dayOfWeek] = openHour;
                            }
                            for (var i = 0; i < 7; i++) {
                                var tempDay = moment(firstDay, 'dddd').add(i, 'days').format('dddd');
                                console.log(tempDay + "@" + openHourDict[tempDay].split(': ')[1]);
                                this.openHourList.push([tempDay, openHourDict[tempDay].split(': ')[1]]);
                            }
                            this.todayHour = openHourDict[firstDay].split(': ')[1];
                            console.log("==this.openHourList==");
                            console.log(this.openHourList);
                        }

                        // prepare the open hour list                                               
                        // if (this.rowDetails.opening_hours) {
                        //     this.openHourList = [];
                        //     var tempHourDict = {}; // key = dayOfWeek, value = openHour details
                        //     var offsetHour = this.rowDetails.utc_offset / 60;
                        //     console.log("offsetHour = " + offsetHour);
                        //     var destinationLocalTime = moment.utc().add(offsetHour, 'hours');
                        //     // build the dict
                        //     for (var i = 0; i < this.rowDetails.opening_hours.weekday_text.length; i++) {
                        //         var day = this.rowDetails.opening_hours.weekday_text[i];
                        //         var dayOfWeek = day.split(': ')[0];
                        //         if (day.split(': ')[1] == 'Closed') {
                        //             tempHourDict[dayOfWeek] ={
                        //                 'dayOfWeek': dayOfWeek,
                        //                 'notOpen': true
                        //             };
                        //         } else {
                        //             var open = day.split(': ')[1].split(' – ')[0];
                        //             var close = day.split(': ')[1].split(' – ')[1];
                        //             tempHourDict[dayOfWeek] = {
                        //                 'dayOfWeek': dayOfWeek,
                        //                 'notOpen': false,
                        //                 'open': open,
                        //                 'close': close
                        //         };
                        //         }
                        //     }
                        //     var firstDay;
                        //     console.log(moment(destinationLocalTime.format('LLLL')));
                        //     var previousDayOfWeek = moment(destinationLocalTime).add(-1, 'days').format('dddd');
                        //     if (tempHourDict[previousDayOfWeek].notOpen) {
                        //         firstDay = moment(destinationLocalTime).format('dddd');
                        //     } else {
                        //         var start = moment(tempHourDict[previousDayOfWeek].open + previousDayOfWeek, 'hh:mm Adddd');
                        //         var end = moment(tempHourDict[previousDayOfWeek].close + previousDayOfWeek, 'hh:mm Adddd');
                        //         // handle over 12
                        //         if (end.isBefore(start)) {
                        //             end.add(1, 'days');
                        //         }
                        //         if (destinationLocalTime.isBetween(start, end)) {
                        //             firstDay = previousDayOfWeek;
                        //         } else {
                        //             firstDay = moment(destinationLocalTime).format('dddd');
                        //         }
                        //     }
                        //     console.log("firstDay = " + firstDay);

                        //     for (var i = 0; i < 7; i++) {
                        //         var tempDay = moment(firstDay, 'dddd').add(i, 'days').format('dddd');
                        //         if (tempHourDict[tempDay].notOpen) {
                        //             this.openHourList.push(tempDay + ": " + "Closed");
                        //         } else {
                        //             this.openHourList.push(tempDay + ": " + tempHourDict[tempDay].open + " – " + tempHourDict[tempDay].close);
                        //         }
                        //     }
                        //     console.log("======this.openHourList is ready=====");
                        //     console.log(this.openHourList);
                        // }




                        // prepare the submitted time of reviews
                        this.reviewsTimeArray = [];
                        this.reviewsObjectArray = [];

                        if (this.rowDetails.reviews) {
                            // console.log("--prepare time--");
                            this.rowDetails.reviews.forEach(element => {
                                // console.log(element.author_name);
                                // console.log(element.time);
                                var day = moment.unix(element['time']);
                                // console.log(day.format('YYYY-MM-DD HH:mm:ss'));
                                this.reviewsTimeArray.push(day.format('YYYY-MM-DD HH:mm:ss'));
                                this.reviewsObjectArray.push(element);
                            });
                        }

                        // set up animation
                        this.searchListAnimState = 'out';
                        this.detailsAnimState = 'in';
                        console.log("this.searchListAnimState" + this.searchListAnimState);
                        console.log("this.detailsAnimState" + this.detailsAnimState);

                        // prepare the photos                               
                        console.log("prepare the photos");
                        console.log(this.rowDetails.photos);
                        this.photoCol0 = [];
                        this.photoCol1 = [];
                        this.photoCol2 = [];
                        this.photoCol3 = [];
                        for (var i = 0; i < this.rowDetails.photos.length; i++) {
                            if (i % 4 == 0) {
                                this.photoCol0.push(this.rowDetails.photos[i])
                            } else if (i % 4 == 1) {
                                this.photoCol1.push(this.rowDetails.photos[i])
                            } else if (i % 4 == 2) {
                                this.photoCol2.push(this.rowDetails.photos[i])
                            } else if (i % 4 == 3) {
                                this.photoCol3.push(this.rowDetails.photos[i])
                            }
                        }
                        console.log(this.photoCol0);
                        console.log(this.photoCol1);
                        console.log(this.photoCol2);
                        console.log(this.photoCol3);

                      });
                    this.detailsReady = true;

                    // PREPARE THE YELP REVIEW
                    var address = this.rowDetails.formatted_address.split('#').join('').split(', ');
                    console.log("----address----");
                    var country = address[address.length - 1];
                    var state = address[address.length - 2].split(' ')[0];
                    var postal_code = address[address.length - 2].split(' ')[1];
                    var city = address[address.length - 3].split(' ').join('+');
                    var latitude = this.rowDetails.geometry.location.lat();
                    var longitude = this.rowDetails.geometry.location.lng();
                    var address1 = [];
                    for (i = 0; i < address.length - 3; i++) {
                        address1.push(address[i].split(' ').join('+'));
                    }
                    var name = this.rowDetails.name.split(' ').join('+');
                    if (this.rowDetails.international_phone_number) {
                        var phone = this.rowDetails.international_phone_number.split(/[\s-]+/).join('');
                    } else {
                        var phone = "";
                    }


                    // var urlForYelpReview = "http://localhost:5975/?action=" + "getYelpReview" +"&name=" + name +
                    //                     "&address1=" + address1.join('_') + "&city=" + city + "&state=" + state +
                    //                     "&postal_code=" + postal_code + "&country=" + country +
                    //                     "&latitude=" + latitude + "&longitude=" + longitude + "&phone=" + phone;
                    var urlForYelpReview = "http://csci571-2-env.us-east-2.elasticbeanstalk.com/?action=" + "getYelpReview" +
                                        "&name=" + name +
                                        "&address1=" + address1.join('_') + "&city=" + city + "&state=" + state +
                                        "&postal_code=" + postal_code + "&country=" + country +
                                        "&latitude=" + latitude + "&longitude=" + longitude + "&phone=" + phone;
                    console.log(urlForYelpReview);
                    this.callServerForYelpReviews(urlForYelpReview);


                    console.log(this.rowDetails);
                    console.log("this.detailsReady = " + this.detailsReady);
                    console.log("---end of this.mapsAPILoader---")
                }
            });
        });
    }

    clickedStar(icon, name, vicinity, place_id) {
        console.log("====in clickedStar()====");
        console.log(icon);
        console.log(name);
        console.log(vicinity);
        console.log(place_id);
        
        var placeObj = {
            'icon': icon,
            'name': name,
            'vicinity': vicinity,
            'place_id': place_id
        };
        if (localStorage.getItem(place_id) === null) {
            console.log("localStorage.getItem(place_id) === null");
            // the key is not in favorite list, add it in and change the color of the star
            localStorage.setItem(place_id, JSON.stringify(placeObj));
            this.favoriteListDict[place_id] = true;
            this.favoriteList.push(placeObj);
        } else {
            console.log("localStorage.getItem(place_id) is not null");
            // the key is already in favorite list, remove is and change the color of the star
            localStorage.removeItem(place_id);
            // set the boolean in favoriteListDict to be false, indicating that this obj is no longer in favoriteList
            this.favoriteListDict[place_id] = false;

            // remove item from this.favoriteList
            // var index = this.favoriteList.indexOf(placeObj);        
            var index = this.favoriteList.map(function(e) { return e.place_id; }).indexOf(place_id);
            console.log("index = " + index);
            this.favoriteList.splice(index, 1);

        }
        this.lenOfFavoriteList = localStorage.length;
        console.log("this.favoriteList:")
        console.log(this.favoriteList);

        if (this.showFavorite) {
            console.log("in removeFromFavorite, need to update");
            this.enableFavorite();
        }
        console.log("===========over==========");
        // update
        // this.lenOfFavoriteList = localStorage.length;
        // this.favoriteList = [];
        // for (var i = this.lenOfFavoriteList - 1; i >= 0 ; i--) {
        //     this.favoriteList.push(JSON.parse(localStorage.getItem(localStorage.key(i))));
        // }

    }

    // removeFromFavorite(place_id) {
    //     localStorage.removeItem(place_id);

    //     this.favoriteListDict[place_id] = false;

    //     console.log("this.showFavorite = " + this.showFavorite);
    //     // we're now in favorite, thus we need to this.enableFavorite() to update now
    //     if (this.showFavorite) {
    //         console.log("in removeFromFavorite, need to update");
    //         this.enableFavorite();
    //     }
    // }


    // --------------------
    // HANDLING TAB
    enableInfoTab() {
        this.showTab = 'info';
    }

    enablePhotosTab() {
        this.showTab = 'photos';
    }

    enableMapTab() {
        this.showTab = 'map';
        // this.from = 'Your location';
        this.travelMode = 'DRIVING';
        this.pegmanElementRef.nativeElement.setAttribute("src", "http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png");

        // wait for DOM to create div
        setTimeout(() => {
            this.initMap();

            // ADDRESS AUTO COMPLETE (fromText)
            this.mapsAPILoader.load().then(() => {
                let autocomplete = new google.maps.places.Autocomplete(this.fromTextElementRef.nativeElement, {
                    types: ["address"]
                });
                autocomplete.addListener("place_changed", () => {
                    let place: google.maps.places.PlaceResult = autocomplete.getPlace();
                    console.log("--autocomplete--");
                    console.log(place.geometry.location.lat());
                    console.log(place.geometry.location.lng());
                    console.log(place);
                    // this.autoComplete = true;
                    // this.autoCompleteResult = place.geometry.location.toUrlValue(4);
                    this.fromLatInMapTab = place.geometry.location.lat();
                    this.fromLngInMapTab = place.geometry.location.lng();
                });
            });
        }, 500);
    }

    enableReviewsTab() {
        this.showTab = 'reviews';
    }
    // --------------------

    // --------------------
    // HANDLING RATING MASK
    mouseEnterRating() {
        this.mouseInRatingRow = true;
    }

    mouseLeaveRating() {
        this.mouseInRatingRow = false;
    }
    // --------------------

    goBackToSearchList() {
        if (this.currentPage == "page0") {
            this.showFirstPage = true;
        } else if (this.currentPage == "page1") {
            this.showSecondPage = true;
        } else if (this.currentPage == "page2") {
            this.showThirdPage = true;
        } else if (this.currentPage == "favorite") {
            this.showFavorite = true;
        }

        this.showDetails = false;

        // set up animation
        this.searchListAnimState = 'in';
        this.detailsAnimState = 'out';
        console.log("this.searchListAnimState" + this.searchListAnimState);
        console.log("this.detailsAnimState" + this.detailsAnimState);

    }

    enableLoadedDetails(){
        this.showDetails = true;
        this.showFirstPage = false;
        this.showSecondPage = false;
        this.showThirdPage = false;
        //this.showTab = 'info';

        // set up animation
        this.searchListAnimState = 'out';
        this.detailsAnimState = 'in';
    }

    // --------------------
    // REVIEWS TAB (MANAGE SOURCE AND ORDER)
    enableGoogleReviews()  {
        this.currentReviewsSource = 'Google Reviews';
        this.updateReviewsArray();

        // fade in animation
        if (this.reviewsAnimState == 'dummyFadeIn') {
            this.reviewsAnimState = 'fadeIn';
        } else {
            this.reviewsAnimState = 'dummyFadeIn';
        }
    }

    enableYelpReviews() {
        this.currentReviewsSource = 'Yelp Reviews';
        this.updateReviewsArray();

        // fade in animation
        if (this.reviewsAnimState == 'dummyFadeIn') {
            this.reviewsAnimState = 'fadeIn';
        } else {
            this.reviewsAnimState = 'dummyFadeIn';
        }
    }

    enableDefaultOrder() {
        this.currentReviewsOrder = 'Default Order';
        this.updateReviewsArray();
    }

    enableHighestRatingOrder() {
        this.currentReviewsOrder = 'Highest Rating';
        this.updateReviewsArray();
    }

    enableLowestRatingOrder() {
        this.currentReviewsOrder = 'Lowest Rating';
        this.updateReviewsArray();
    }

    enableMostRecentOrder() {
        this.currentReviewsOrder = 'Most Recent';
        this.updateReviewsArray();
    }

    enableLeastRecentOrder() {
        this.currentReviewsOrder = 'Least Recent';
        this.updateReviewsArray();
    }

    updateReviewsArray() {
        this.reviewsObjectArray = [];
        if (this.currentReviewsSource == 'Google Reviews') {
            this.rowDetails.reviews.forEach(element => {
                this.reviewsObjectArray.push(element);
            });
            this.reviewsObjectArray.forEach(element => {
                var day = moment.unix(element.time);
                this.reviewsTimeArray.push(day.format('YYYY-MM-DD HH:mm:ss'));
            });
            if (this.currentReviewsOrder == 'Default Order') {
                // It's done, just pass
            } else if (this.currentReviewsOrder == 'Highest Rating') {
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(b.rating) - parseInt(a.rating) });
            } else if (this.currentReviewsOrder == 'Lowest Rating') {
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(a.rating) - parseInt(b.rating) });
            } else if (this.currentReviewsOrder == 'Most Recent') {
                console.log("Google Reciews, Most Recent");
                console.log("before sorting:");
                console.log(this.reviewsObjectArray);
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(b.time) - parseInt(a.time) });
                console.log("after sorting:");
                console.log(this.reviewsObjectArray);

                // update the time array as well
                this.reviewsTimeArray = [];
                this.reviewsObjectArray.forEach(element => {
                    var day = moment.unix(element.time);
                    this.reviewsTimeArray.push(day.format('YYYY-MM-DD HH:mm:ss'));
                });
            } else if (this.currentReviewsOrder == 'Least Recent') {
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(a.time) - parseInt(b.time) });
                // update the time array as well
                this.reviewsTimeArray = [];
                this.reviewsObjectArray.forEach(element => {
                    var day = moment.unix(element.time);
                    this.reviewsTimeArray.push(day.format('YYYY-MM-DD HH:mm:ss'));
                });
            }
        } else if (this.currentReviewsSource == 'Yelp Reviews') {
            this.yelpReviewsObjArray.forEach(element => {
                this.reviewsObjectArray.push(element);
            });
            if (this.currentReviewsOrder == 'Default Order') {
                // It's done, just pass
            } else if (this.currentReviewsOrder == 'Highest Rating') {
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(b.rating) - parseInt(a.rating) });
            } else if (this.currentReviewsOrder == 'Lowest Rating') {
                this.reviewsObjectArray.sort(function(a, b) { return parseInt(a.rating) - parseInt(b.rating) });
            } else if (this.currentReviewsOrder == 'Most Recent') {
                this.reviewsObjectArray.sort(function(a, b) { return b.time_created.localeCompare(a.time_created) });
            } else if (this.currentReviewsOrder == 'Least Recent') {
                this.reviewsObjectArray.sort(function(a, b) { return a.time_created.localeCompare(b.time_created) });
            }
        }
    }
    // --------------------

    // --------------------
    // MAP TAB
    initMap() {
        this.map = new google.maps.Map(this.myMapElementRef.nativeElement, {
            zoom: 14,
            center: {lat: this.rowDetails.geometry.location.lat(), lng: this.rowDetails.geometry.location.lng()}
        });

        // create marker for the target location
        this.marker = new google.maps.Marker({
            map: this.map,
            position: {
            lat: this.rowDetails.geometry.location.lat(),
            lng: this.rowDetails.geometry.location.lng()
            }
        });

        this.directionsDisplay = new google.maps.DirectionsRenderer;

        // DirectionsService object to send and receive direction requests
        this.directionsService = new google.maps.DirectionsService;

        this.panorama = this.map.getStreetView();
        this.panorama.setPosition({
            lat: this.rowDetails.geometry.location.lat(),
            lng: this.rowDetails.geometry.location.lng()
        });
        this.panorama.setPov({
            heading: 10,
            pitch: 10
        });

        // setTimeout(() => {
        //     this.panorama.setVisible(false);
        // }, 500);
        this.panorama.setVisible(false);
        console.log("end of initMap()");
    }

    onSubmitMap() {
        console.log("====in onSubmitMap()====");
        console.log(this.from);
        console.log(this.travelMode);

        // remove the marker
        this.marker.setMap(null);

        this.directionsDisplay.setMap(this.map);

        this.calculateAndDisplayRoute();

    }

    calculateAndDisplayRoute() {
        // set up origin place
        var originPlace: any;
        // IF USERS DIDN'T SET UP LOCATION, USE THE ONE IN SEARCH FORM
        if (this.from == "Your location" || this.from == this.searchElementRef.nativeElement.value) {
            if (this.currentBtn) {
                originPlace = {lat: this.latitude, lng: this.longitude};
            } else if (this.otherBtn && this.autoComplete) {
                originPlace = this.autoCompleteResult;
            } else if (this.otherBtn && !this.autoComplete) {
                originPlace = this.model.locText;
            }
        } else if (this.from == "My location") {
            originPlace = {lat: this.currLat, lng: this.currLng};
        } else if (this.fromLatInMapTab != 999 && this.fromLngInMapTab != 999) {
            originPlace = {lat: this.fromLatInMapTab, lng: this.fromLngInMapTab};
        } else {
            originPlace = this.from;
        }

        // RESET fromLatInMapTab AND fromLngInMapTab FOR NEXT TIME
        this.fromLatInMapTab = 999;
        this.fromLngInMapTab = 999;


        this.directionsService.route({
            // origin: {lat: this.fromLatInMapTab, lng: this.fromLngInMapTab},
            origin: originPlace,
            destination: {lat: this.rowDetails.geometry.location.lat(), lng: this.rowDetails.geometry.location.lng()},
            travelMode: google.maps.TravelMode[this.travelMode],
            provideRouteAlternatives: true
        }, (response, status) => {
            if (status == 'OK') {
                this.directionsDisplay.setDirections(response);

                this.directionsDisplay.setPanel(this.panelElementRef.nativeElement);

            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }

    toggleStreetView() {
        // this.togglePanorama = !this.togglePanorama;
        // this.panorama.setVisible(this.togglePanorama);
        console.log("==in toggleStreetView()==")
        console.log(this.panorama.getVisible())
        if (this.panorama.getVisible()) {
          this.panorama.setVisible(false);
          this.pegmanElementRef.nativeElement.setAttribute("src", "http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png");
        } else {
          this.panorama.setVisible(true);
          this.pegmanElementRef.nativeElement.setAttribute("src", "http://cs-server.usc.edu:45678/hw/hw8/images/Map.png");
        }
        console.log(this.panorama.getVisible());
    }
    // --------------------

    // CALL SERVER FOR YELP REVIEWS
    callServerForYelpReviews(urlToServer) {
        console.log("====In callServerForYelpReviews()====");
        console.log(urlToServer);
        this.http.get(urlToServer).subscribe(data => {
            console.log("got the data returned from backend");
            console.log(data);
            if (!data) {
                console.log("There's no such a place id in yelp");
                this.yelpReviewsObjArray = [];
            } else {
                console.log("Success~~");
                this.yelpReviewsObjArray = [];
                data['reviews'].forEach(element => {
                    this.yelpReviewsObjArray.push(element);
                });
            }
        });
    }

    setUpTwitterUrl(name, address, website, url) {
        name = encodeURIComponent(name);
        console.log(name);
        address = encodeURIComponent(address);
        console.log(address);
        if (website) {
            website = encodeURI(website);
            console.log(website);
            this.twitterUrl = "https://twitter.com/intent/tweet" +
                        "?text=" + "Check%20out%20" + name +
                        "%20locate%20at%20" + address + ".%0A" +
                        "Website%3A" + "&url=" + website +
                        "&hashtags=" + "TravelAndEntertainmentSearch";
        } else {
            url = encodeURI(url);
            console.log(url);
            this.twitterUrl = "https://twitter.com/intent/tweet" +
                        "?text=" + "Check%20out%20" + name +
                        "%20locate%20at%20" + address + ".%0A" +
                        "Website%3A" + "&url=" + url +
                        "&hashtags=" + "TravelAndEntertainmentSearch";
        }

        console.log("this.twitterUrl");
        console.log(this.twitterUrl);

    }
}