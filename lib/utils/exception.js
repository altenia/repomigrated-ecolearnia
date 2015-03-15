/*****************************************************************************
 *
 * The the JSON representation of an error object
 * {{
 *     apiVersion
 *     code:    !string, // Unique identifier of the error
 *     status:  !number, // The error status using the standard HTTP status code
 *     message: !string, // Error message ()
 *     errors: [{
 *         domain: !string,
 *         cause: string,
 *     }]
 *     _logged: ?boolean, // as the property name says
 * }}  
 *
 * **************************************************************************/

/**
 * Declaration of internals name-space
 */
var internals = {};


/* **************************************************************************
 * Exception                                                            */ /**
 *
 * Constructor function for the Exception class.
 *
 * @constructor
 *
 ****************************************************************************/
internals.Exception = function(code, status, message, details, stack)
{
    /**
     * The '@type' property must be the value 'Exception' to identify this
     * object as a Exception w/o depending on the class hierarchy. This is
     * property is included in the serialized object when this instance
     * is serialized to JSON.
     * @const
     * @type {string}
     */
    this['@type'] = 'Exception';

    /**
     * Error code
     * @type {string}
     */
    this.code = code;

    /**
     * The HTTP status code if applicable. 
     * @type {number}
     */
    this.status = status;

    /**
     * End-user friendly error message.
     * @type {string}
     */
    this.message = message;

    /**
     * Additional optional details
     * @type {Object}
     */
    this.details = details;

    /**
     * Exception Stack
     * @type {Array.<Exception>}  
     *  
     */
    this.stack = stack;

};

//module.exports.Exception.prototype = new Error();

/* **************************************************************************
 * Exception.createFromObject
 * 
 * Create a new Exception instance from an object w/ the necessary properties.
 * The object should contain the property '@type' with the value 'Exception'. 
 *
 * @param {Object} error     The object that will be used to create the Exception
 *                           if it contains the necessary properties.
 *                           THe error object can also be of type Error, in
 *                           this case, the method will return Exception 
 *                           object that wraps around error's message.
 *
 * @returns {?Exception} a new Exception w/ properties initialized
 * from the given error object, or null if the given object didn't have the
 * necessary properties.
 */
internals.Exception.createFromObject = function(error)
{
    if (error instanceof Error)
    {
        // It is a native Error object, E-RTN000 means Runtime error
        return new internals.Exception('E-RunTime',
                500,
                'Runtime Error: ' + error.message,
                {
                    description: error.toString(),
                },
                [ {details: error.stack} ]
            );
    }
    else
    {
        if (error['@type'] === 'Exception')
        {
            return new internals.Exception(error.code,
                error.status,
                error.message,
                error.details,
                error.stack);
        }
    }

    return null;
};


/***************************************************************************
 * toJSON
 *
 * Get a JSON ready object containing the properties of this Exception.
 *
 * @returns {Object} an object with JSON ready property values.
 *
 */
internals.Exception.prototype.toJSON = function ()
{
    var jsonError = {
            '@type': this['@type'],
            'code': this.code,
            'status': this.status,
            'message': this.message,
            'details': this.details,
            'stack': this.stack
        };

    return jsonError;
};

module.exports.Exception = internals.Exception;
