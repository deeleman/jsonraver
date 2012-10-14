var processRequest = function (requestObject, onComplete) {
    "use strict";
    var data, errors = {}, i, output;

    try {
        require('request')({
            timeout : 12000,
            uri : requestObject.uri
        }, function (error, response, body) {

            if (!response) {
                errors = {
                    error : ['WARNING!', requestObject.uri, 'returned NO RESPONSE'].join(' ')
                };
            } else if (!error && response.statusCode <= 200) {
                try {
                    data = JSON.parse(body);
                } catch (err) {
                    errors = {
                        status : response.statusCode,
                        error : ['WARNING!', requestObject.uri, 'returned an illegal JSON message:', body].join(' ')
                    };
                }

                if (data.errors) {
                    errors = {
                        status : response.statusCode,
                        error : ['WARNING #', i, ':', requestObject.uri, 'returned the following error:', data.errors[i]].join(' ')
                    };
                }
            } else {
                errors = {
                    status : response.statusCode,
                    error : ['WARNING!', requestObject.uri, 'returned an error message:', error].join(' ')
                };
            }

            if (errors && requestObject.fail) {
                requestObject.fail(errors);
            }

            if (typeof onComplete !== 'function') {
                throw new Error('No callback found to handle return object from single request');
            } else {
                output = errors.length > 0 ? errors : data;
                onComplete(output);
            }
        });

    } catch (err) {
        onComplete({
            error : err.message
        });
    }

};

var processRequestPool = function (pool, onComplete) {
    "use strict";
    var i, count = 0, errors = [], output = {}, index, processData;
    
    processData = function(data) {
        var requestObj = pool[count];
        index = requestObj.id || count.toString();
        if (Object.prototype.hasOwnProperty.call(output, index)) {
            throw new Error('The request object contained more than one request with the "' + index + '" identifier');
        }
        output[index] = data;

        if (data && data.error) {
            output[index].callId = index;
            errors = errors.concat(data);
        }

        count += 1;
        if (count === pool.length) {
            if (errors.length > 0) {
                output.jsonraver_errors = errors;
            }

            onComplete(output);
        }
    }; 
    
    for (i = 0; i < pool.length; i += 1) {
        processRequest(pool[i], processData);
    }
};

var jsonraver = function (request, callback) {"use strict";
    var pool = [], i;

    if ( typeof request === 'string') {
        pool.push({
            uri : request
        });
    } else if (typeof request === 'object') {
        if (Object.prototype.toString.call(request) === '[object Array]') {
            for (i = 0; i < request.length; i += 1) {
                if (typeof request[i] === 'string') {
                    pool.push({
                        uri : request[i]
                    });
                } else {
                    pool.push(request[i]);
                }
            }
        } else {
            pool.push(request);
        }
    }

    if (typeof callback !== 'function') {
        throw new Error('A callback function is required everytime jasonraver is instanced');
    }

    return processRequestPool(pool, callback);
};

exports = module.exports = jsonraver;
