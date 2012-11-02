JSON Raver
=========

An easy-to-use Node.js utility module for performing one or multiple async GET requests to third party JSON web services simultaneously though a simple API with batch-request functionality.

[![Build Status](https://secure.travis-ci.org/deeleman/jsonraver.png)](http://travis-ci.org/deeleman/jsonraver)

----------

# Why JSON Raver? #

Node.js is cool when it comes to consuming web services thanks to its awesome architecture and the impressive module ecosystem around it, featuring excellent tools such as [HTTP](http://nodejs.org/api/http.html "HTTP") or [Request](https://github.com/mikeal/request) (JSON Raver leverages the latter to perform all GET requests - Thanks [Mikeal](https://github.com/mikeal)!). But whoever has felt in the need to consume more than one service at once and therefore build a composite JSON message with all the information returned knows that avoiding the infamous [callback hell](http://callbackhell.com/) is a pain in the ass. 

**This is why JSON Raver was created.** The idea behind this NodeJS module is quite simple: To provide the simplest interface to make asyncrononous requests to different web services exposing JSON data and return a composite JSON message with all the information gathered once all http requests have been accomplished and HTTP exceptions have been handled.

**JSON Raver is for you if...**

- Consume several web services at once and render a web page with all the information gathered in a single object.
- Fetch data from different JSON sources and provide graceful fallbacks when one or some of those sources fail returning data.
- Turn asyncronous consumption of spare web services into a single asyncronous action.

**JSON Raver is *NOT* for you if...**

- You need to pass data in your request by POST.
- You need to execute POST, PUT or DELETE http actions. 
- You need to consume data served in a format other than JSON.
- You want to execute a *fire & forget* GET request. JSON Raver will require a callback to be defined in its payload (regardless the callback provided in the payload is populated or not)

----------
# How to Use JSON Raver#

For all our examples we will figure out that we need to consume 2 separate REST services that provide GEO data in JSON format: One returns GEO coordinates and the other one exposes demographic info.

## Performing single JSON GET requests ##

Let's figure out you want to consume the coordinates of London from our example GEO data service.

```javascript
var jsonraver = require('jsonraver'), geodata;

jsonraver('http://www.example.com/geo/coords/london.json', function(err, data) {
	if(err) {
		// Error is handled - Read below for details about error handling
	} else {
		geodata = data;
	}               
});
```

The `geodata` variable would be populated with the following fixture content. The leading parent "0" node refers to the index corresponding to the data requested. It is customisable and quite useful for applying structure to batch requests entailing several calls to different JSON web services:

```javascript
{
	'0' : {
		latitude: 51.506944,
		longitude: -0.1275
	}
}
```


## Performing composite JSON GET requests ##

Now we are going to push our example one step forward by requesting the two GEO data services mentioned above. For doing so, we include an array of URIs instead of a plain string.

```javascript
var webServices = [
	'http://www.example.com/geo/coords/london.json', 
	'http://www.example.com/geo/demographics/london.json'
	];

jsonraver(webServices, function(err, data) {
	// Error handling removed for brevity's sake
	geodata = data;         
});
```

The resulting output would populate the `geodata` variable with this information. Again, pay attention to how each block of data corresponding to each call has an index parent node:

```javascript
{
	'0' : {
		latitude: 51.506944,
		longitude: -0.1275
	},
	'1' : {
		population: 7556900,
		density: 4761,
		demonym: 'londoner'
	}
}
```

## Customising output ##

All blocks will keep the same sorting order in which the requests were made inside the request array to ease coupling afterwards each request with its corresponding index parent node. In any event, you will be willing to get a more elegant returning message. No worries! JSON Raver allows you to customise the name of each parent name according to your requirements. Just see how we can turn each call into an object literal and assign an `id` member to each call that will turn into the parent node of the corresponding return data block:

```javascript
var webServices = [
	{ id: 'coords', uri: 'http://www.example.com/geo/coords/london.json' },
	{ id: 'population', uri: 'http://www.example.com/geo/demographics/london.json' }
	];

jsonraver(webServices, function(err, data) {
	// Error handling removed for brevity's sake
	geodata = data;         
});
```

This call would return the following object, making it easier to address each data block regardless the order they were pulled into the request array:

```javascript
{
	'coords' : {
		latitude: 51.506944,
		longitude: -0.1275
	},
	'population' : {
		population: 7556900,
		density: 4761,
		demonym: 'londoner'
	}
}
```

## Adding per-request callbacks ##

Once each and every request has been accomplished (succesfully or not, see "handling errors" below) and the composite object has been built and returned throughb the callback function, we may consider that the job is done. But, what if we need to take decisions when an specific request in our batch is accomplished?

A good example of this would be when we need to provide graceful fallbacks in case one or some of the requests fail, or when we need to perform operations with any of the returning data as soon as it is available. Following the example above, let's add an onComplete callback to the first call or our payload:

```javascript
var webServices = [
	{ 
		id: 'coords', 
		uri: 'http://www.example.com/geo/coords/london.json', 
		onComplete: function(err, data) { 
				// We manage both the error and data handling inside this callback
			} 
		},
	{ 
		id: 'population', 
		uri: 'http://www.example.com/geo/demographics/london.json' 
	}
];
```

We should remark that the returning object in the per-request callback does not include any index parent node regardless we include any when defining the request object. This may change at any point and any feedback would be appreciated.

## Handling errors ##

This is not a perfect world, shit happens and errors occur. JSON Raver provides functionality to debug easily your app and keep everything working smoothly by allowing the developer to handle all exceptions on a per-request basis or once all the request have been accomplished.

### Anatomy of errors on a per request basis ###

If we define an `onComplete` callback on any of our requests, the returning error will feature the following format:

```javascript
{
	httpStatus: [HTTP integer status returned by the remote JSON web service if any],
	message: '[Detailed error message here]'
}

```

### Anatomy of errors returned in the global callback ###

The format is pretty much the same we've just seen above with only one remarkable difference: The callback returns an array of error objects (one per each failed request) instead of a single object and each error object contains a `requestId` property so we can easily match each error with its corresponding request. Let's perform a composite call with a wrong URI:

```javascript
var webServices = [
	{ 
		id: 'coords', 
		uri: 'http://www.example.com/geo/coords/london.json', 
		onComplete: function(err, data) { 
				// We manage both the error and data handling inside this callback
			} 
		},
	{ 
		id: 'population', 
		uri: 'http://www.bad-domain.com/returns/nothing' 
	}
];
```

Would return the following error through the global callback:


```javascript
[{
	httpStatus: 404, 
	message: 'WARNING! http://www.bad-domain.com/returns/nothing returned NO RESPONSE' ,
	requestId : 'population'
}]

```






