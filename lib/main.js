var processRequest = function (requestObject, onComplete) {
    "use strict";
    var error, result, buildError, requestCallback;
    
    buildError = function(err, status) {
        error = {
            message : Object.prototype.toString.call(err) === '[object Array]' ? err.join(' ') : err
        };
        
        if(status) {
            error.httpStatus = status;
        }
    };
    
    requestCallback = function(error, response, body) {
        if (!response) {
            buildError(['WARNING!', requestObject.uri, 'returned NO RESPONSE']);
        } else if (!error && response.statusCode <= 200) {
            try {
                result = JSON.parse(body);
            } catch (err) {
                buildError(['WARNING!', requestObject.uri, 'returned an illegal JSON message:', body], response.statusCode);
            }

            if (result.errors) {
                buildError(['WARNING!', requestObject.uri, 'returned the following error:', result.errors.toString()], response.statusCode);
            }
        } else {
            buildError(['WARNING!', requestObject.uri, 'returned an error message:', error], response.statusCode);
        }

        if (error && requestObject.fail) {
            requestObject.fail(error, requestObject);
        }
        
        onComplete(error, result);
    }; 

    try {
        require('request')({
            timeout : 12000,
            uri : requestObject.uri
        }, requestCallback);
    } catch (err) {
        buildError(err.toString());
        onComplete(error, result);
        
    } 
};

var processRequestPool = function (pool, onComplete) {
    "use strict";
    var i, count = 0, errors, result = {}, nodeName, processData, buildErrors;
    
    buildErrors = function(nodeName, err) {
        if (err) {
            errors = errors || [];
            err.requestId = nodeName;
            errors.push(err);
        }
    };
    
    processData = function(err, data) {
        var requestObj = pool[count];
     
        nodeName = requestObj.id || count.toString();
        
        buildErrors(nodeName, err);
        
        if (Object.prototype.hasOwnProperty.call(result, nodeName)) {
            buildErrors(nodeName, { error: 'The request object contained more than one request with the "' + nodeName + '" identifier. Only the first one will be served.' });
        }
        
        result[nodeName] = data;
        count += 1;

        if (count === pool.length) {
            //console.log(errors);
            onComplete(errors, result);
        }
    }; 
    
    for (i = 0; i < pool.length; i += 1) {
        processRequest(pool[i], processData);
    }
};

var jsonraver = function (request, callback) {
    "use strict";
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
        throw new Error('A callback function is required by jasonraver in order to handle the data retrieved');
    }

    return processRequestPool(pool, callback);
};

exports = module.exports = jsonraver;
