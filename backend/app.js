var http = require('http');
var url = require('url');

const yelp = require('yelp-fusion');
const apiKey = 'ocfyKDT4LnWY91Im4O-kv8IR1DtPw8td-aUiygpUO7aYnVRGsf9jtAw-ncRzWbcjBK1JsQWhAePYB0xL2IPjTe0ibZ_uMMyLA49hx_UsQAJi1oB-FIABTURu5nDBWnYx';
const client = yelp.client(apiKey);

http.createServer(function (req, res) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Headers', '*');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);


    res.writeHead(200, {'Content-Type': 'application/json'});
    // res.writeHead(200, {'Content-Type': 'text/html'});

    var q = url.parse(req.url, true).query;
    result = ""; // global variable, may contain up to 3 pages of result


    if (q.action == null) {
        res.end("Action is undefined, check if the url is correct!");
        return
    } else {
        var action = String(q.action);
    }

    // CALL THE GOOGLE GEOCODING TO GET THE LATITUDE AND LONGITUDE
    if (action == "getOtherLoc") {
        var location = String(q.locText);
        var urlForGeocoding = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location.split(' ').join('+') + "&key=AIzaSyCRN8JExWAfJ7Cqg8eMVGIrK-13UMbAS-0";
        // res.write(link);
        var https = require('https');

        https.get(urlForGeocoding, (resp) => {
            var data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                var jsonObjForGeocoding = JSON.parse(data);
                console.log("------");
                // console.log(jsonObjForGeocoding);
                // test(jsonObjForGeocoding);
                if (jsonObjForGeocoding.status == "ZERO_RESULTS") {
                    console.log("There's no result, check the locText again.");
                    res.end("");
                    return;
                }
                console.log(jsonObjForGeocoding.results[0].geometry.location);
                console.log(jsonObjForGeocoding.results[0].geometry.location.lat);
                console.log(jsonObjForGeocoding.results[0].geometry.location.lng);
                var urlForGeocoding = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" +
                                    jsonObjForGeocoding.results[0].geometry.location.lat + "," +
                                    jsonObjForGeocoding.results[0].geometry.location.lng +
                                    "&radius=" + q.radius + "&type=" + q.category +
                                    "&keyword=" + q.keyword + "&key=AIzaSyCRN8JExWAfJ7Cqg8eMVGIrK-13UMbAS-0";
                doNearbySearch(urlForGeocoding, 0);
                // res.write(data);
                // res.end();
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } else if (action == "getCurrentLoc"){
        var urlForGeocoding = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" +
                                    q.lat + "," + q.lng +
                                    "&radius=" + q.radius + "&type=" + q.category +
                                    "&keyword=" + q.keyword + "&key=AIzaSyCRN8JExWAfJ7Cqg8eMVGIrK-13UMbAS-0";
        doNearbySearch(urlForGeocoding, 0);
    } else if (action == "getYelpReview") {
        console.log("---------------------------------");
        console.log("the action is getYelpReview");
        console.log(q);
        var name = String(q.name);
        var address1 = String(q.address1).split('_').join(' ');
        var city = String(q.city);
        var state = String(q.state);
        var postal_code = String(q.postal_code);
        var country = String(q.country);
        var latitude = String(q.latitude);
        var longitude = String(q.longitude);
        var phone = String(q.phone);
        console.log("name = " + name);
        console.log("address1 = " + address1);
        console.log("city = " + city);
        console.log("state = " + state);
        console.log("postal_code = " + postal_code);
        console.log("country = " + country);
        console.log("latitude = " + latitude);
        console.log("longitude = " + longitude);
        console.log("phone = ", phone);

        doYelpBusinessMatch(name, address1, city, state, postal_code, phone);
    }

    // DO NEARBY SEARCH
    function doNearbySearch(url, page) {
        console.log("==in doNearbySearch()==");
        console.log(page);
        console.log(url);

        // MODIFY THE URL
        if (page > 0) {
            var token = url;
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=" + token + "&key=AIzaSyCRN8JExWAfJ7Cqg8eMVGIrK-13UMbAS-0";

        }
        console.log("new url = " + url);

        var https = require('https');

        https.get(url, (resp) => {
            var data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                if (JSON.parse(data)['status'] == "INVALID_REQUEST") {
                    console.log("---------------------------------");
                    doNearbySearch(token, page);
                } else {
                    if (page > 0) {
                        result += ",";
                    }
                    console.log("typeof = " + typeof data);
                    result += "\"page" + page + "\":" + data;
                    // result += "{" + data + "}";
                    console.log(result);
                    // res.end(result);
                    // console.log(data);
                    console.log(JSON.parse(data)['next_page_token']);
                    if (JSON.parse(data)['next_page_token']) {
                        // getSecondPage(JSON.parse(data)['next_page_token']);
                        console.log("==Let's do one more search==");
                        doNearbySearch(JSON.parse(data)['next_page_token'], page + 1);
                    } else {
                        res.end("{" + result + "}");
                    }
                }
                
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }

    // DO YELP BUSINESS MATCH TO GET THE PLACE ID
    function doYelpBusinessMatch(name, address1, city, state, postal_code, phone) {
        var yelpPlaceId;
        // matchType can be 'lookup' or 'best'
        client.businessMatch('best', {
            name: name,
            address1: address1,
            city: city,
            state: state,
            country: 'US',
            postal_code: postal_code,
            phone: '+' + phone
        }).then(response => {
            console.log(response.jsonBody.businesses);
            if (response.jsonBody.businesses[0] === undefined) {
                console.log("There's no such a place id in yelp");
                res.end("");
            } else {
                yelpPlaceId = response.jsonBody.businesses[0].id;
                console.log(yelpPlaceId);
                doYelpBusinessReviews(yelpPlaceId);
            }
        }).catch(error => {
            console.log(error);
        });
    }

    // USE THE ID TO GET THE REVIEWS
    function doYelpBusinessReviews(yelpPlaceId) {
        var https = require('https');
        var options = {
            host: "api.yelp.com",
            path: "/v3/businesses/" + yelpPlaceId + "/reviews",
            headers: {
                "Authorization": "Bearer " + apiKey
            }
        };
        https.get(options, (resp) => {
            var data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                console.log("---success!---")
                console.log(data)
                res.end(data);
            })
        }).on('error', (err) => {
            console.log("Error: " + err.message);
        });
    }

// }).listen(5975);
}).listen(8081);
