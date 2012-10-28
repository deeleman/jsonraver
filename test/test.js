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
        }
    };

    before(function(done) {
        var app = express();

        app.get('/mocks/:id', function(req, res, next) {
            res.json(mocks['mock' + req.params.id.toString()]);
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
        it('should honour a fail callback on any of its arguments and trigger it when that specific request raises an error');
        
        it('Return error object chlid nodes should inclue a "requestId" parameter matching the identifier or number of the request causing the error');
    });
});

// Usage:
/*
 * jsonraver('http://www.domain.com/data.json', callback(err, result));
 * jsonraver(['http://www.domain.com/data.json', 'http://www.domain.com/moredata.json'], callback(err, result));
 * jsonraver({ uri: 'http://www.domain.com/data.json' }, callback(err, result));
 * jsonraver({ uri: 'http://www.domain.com/data.json', nodeName: 'foo' }, callback(err, result));
 * jsonraver({ uri: 'http://www.domain.com/data.json', nodeName: 'foo', fail: function(err, sender){ ... } }, callback(err, result));
 * jsonraver([{ uri: 'http://www.domain.com/data.json', nodeName: 'foo', fail: function(err, sender){ ... } }, { uri: 'http://www.domain.com/moredata.json', nodeName: 'morefoo' }], callback(err, result));
 *
 */