var express = require('express'), assert = require('assert'), jsonraver = require('../lib/main.js');

describe('JsonRaver', function() {
    "use strict";
    var mocks = {
        'mock1' : {
            id : '1',
            success : 'true'
        },
        'mock2' : {
            id : '2',
            success : 'true'
        },
        'mock3' : {
            capital : 'Madrid',
            latitude : '40.418889',
            longitude : '-3.691944'
        },
        'mock4' : {
            capital : 'London',
            latitude : '51.506944',
            longitude : '-0.1275'
        },
        'mock5' : {
            errors : ['Error A', 'Error B']
        }
    };

    before(function(done) {
        var app = express();

        app.get('/mocks/:id', function(req, res, next) {
            res.json(mocks['mock' + req.params.id.toString()]);
        });
        
        app.get('/noresponse', function(req, res, next) {
            // nothing happens
        });
        
        app.get('/error500', function(req, res, next) {
            res.send(500, { error: 'something blew up' });
        });
        
        app.get('/nojson', function(req, res, next) {
            res.send(200, 'Sorry! No JSON data available here.');
        });

        app.listen(8080);

        done();
    });

    describe('parameter test', function() {

        it('should accept a string as an argument and return an actual JSON object', function(done) {
            jsonraver('http://localhost:8080/mocks/1', function(err, data) {
                assert.deepEqual(data[0], mocks.mock1, 'The module did not returned the expected mock');
                done();
            });
        });

        it('should accept an object as an argument and return an actual JSON object', function(done) {
            var request = {
                uri : 'http://localhost:8080/mocks/1'
            };

            jsonraver(request, function(err, data) {
                assert.deepEqual(data[0], mocks.mock1, 'The module did not returned the expected mock');
                done();
            });
        });

        it('should accept an array as an argument and return an actual JSON object', function(done) {
            var request = ['http://localhost:8080/mocks/1', 'http://localhost:8080/mocks/2'], expected = {
                '0' : mocks.mock1,
                '1' : mocks.mock2
            };

            jsonraver(request, function(err, data) {
                assert.deepEqual(data, expected, 'The module did not returned the expected mock');
                done();
            });
        });

        it('should require at least a valid url as a string parameter', function(done) {
            jsonraver('localhost:8080/mocks/1', function(err, data) {
                assert.ok(err, 'The module returned an actual populated error object within its callback');
                done();
            });
        });

        it('should require valid urls when an array of urls are passed by', function(done) {
            var request = ['localhost:8080/mocks/1', 'localhost:8080/mock2'];

            jsonraver(request, function(err, data) {
                assert.ok(err, 'The module returned an actual populated error object within its callback');
                done();
            });
        });

        it('should require valid urls when an object literal with multiple requests is passed by', function(done) {
            var request = [{
                uri : 'localhost:8080/mocks/1'
            }, {
                uri : 'localhost:8080/mocks/2'
            }];

            jsonraver(request, function(err, data) {
                assert.ok(err, 'The module did not returned the expected mock');
                done();
            });
        });

    });
    
    describe('output test', function() {

        it('if identifiers added, each call will have each identifier as the parent node', function(done) {
            var request = [{
                id : 'Spain',
                uri : 'http://localhost:8080/mocks/3'
            }, {
                id : 'UK',
                uri : 'http://localhost:8080/mocks/4'
            }],
                expected = { Spain : mocks.mock3, UK : mocks.mock4 };

            jsonraver(request, function(err, data) {
                assert.deepEqual(data, expected, 'The module did not returned the expected mock');
                done();
            });
        });
        

        it('if identifiers added, each one must be unique', function(done) {
            var request = [{
                id : 'UK',
                uri : 'http://localhost:8080/mocks/3'
            }, {
                id : 'UK',
                uri : 'http://localhost:8080/mocks/4'
            }];

            jsonraver(request, function(err, data) {
                assert.ok(err, 'The module threw an exception and wrapped it up inside an error object');
                done();
            });
        }); 
        
    });
    
    describe('error handling', function() {
                
        it('should return an error if no response is returned', function(done) {
            
            this.timeout(12000);
            
            jsonraver('http://localhost:8080/noresponse', function(err, data) {
                assert.equal(err[0].message.indexOf('ETIMEDOUT') > 0, true, 'An ETIMEDOUT error will be returned from the server ');
                done();
            });
        });
        
        it('should return an error when the service to be consumed returns a http status other than 200', function(done) {
            jsonraver('http://localhost:8080/error500', function(err, data) {
                assert.equal(err[0].httpStatus, 500, 'An error object is returned including the origin error HTTP status');
                done();
            });
        });
        
        it('should return an error if the message returned cannot be parsed as JSON', function(done) {
            jsonraver('http://localhost:8080/nojson', function(err, data) {
                assert.ok(err, 'The module threw an exception and wrapped it up inside an error object');
                assert.equal(err[0].message.indexOf('Unexpected token') > 0, true, 'The "unexpected token" exception is found in the error message');
                done();
            });
        });
        
        it('should forward the error retrieved in the JSON response', function(done) {
            jsonraver('http://localhost:8080/mocks/5', function(err, data) {
                assert.ok(err, 'The module threw an exception and wrapped it up inside an error object');
                done();
            });
        });
        
        it('should honour a per request callback on any of its arguments and trigger it when that specific request is complete', function(done) {
            var request1 = {
                    id : 'Spain',
                    uri : 'http://localhost:8080/mocks/3'
                },
                request2 = {
                    id : 'UK',
                    uri : 'http://localhost:8080/mocks/4',
                    onComplete : function(err, data) {
                        assert.deepEqual(data, mocks.mock4, 'The onComplete callback returns the object corresponding to the call including it');
                        done();
                    }
                };
                
            jsonraver([request1, request2], function(err, data) {
                return;
            });
        });
        
        it('should honour a per request callback on any of its arguments and include any eventual error details if the requests could not be accomplished succesfully', function(done) {
            var request1 = {
                    id : 'Spain',
                    uri : 'http://localhost:8080/mocks/3'
                },
                request2 = {
                    id : 'UK',
                    uri : 'http://localhost:8080/mocks/45646',
                    onComplete : function(err, data) {
                        assert.ok(err, 'Detailed error information is returned');
                        done();
                    }
                };
                
            jsonraver([request1, request2], function(err, data) {
                return;
            });
        });
        
        it('child nodes in returned error object should include a "requestId" parameter matching the number/sorting order of the request raising the error', function(done) {                
            jsonraver(['http://localhost:8080/mocks/3', 'http://localhost:8080/mocks/45646'], function(err, data) {
                assert.deepEqual(err[0].requestId, '1', 'The module returned an error with the same requestID number of the buggy request call');
                done();
            });
        });
        
        it('child nodes in returned error object should include a "requestId" parameter matching the identifier of the request raising the error', function(done) {
            var request1 = {
                    id : 'Spain',
                    uri : 'http://localhost:8080/mocks/3'
                },
                request2 = {
                    id : 'UK',
                    uri : 'http://localhost:8080/mocks/45646'
                };
                
            jsonraver([request1, request2], function(err, data) {
                assert.deepEqual(err[0].requestId, 'UK', 'The module returned an error with the same requestID name of the buggy request call');
                done();
            });
        });
    });
});