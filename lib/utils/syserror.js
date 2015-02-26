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
 * Declaration of name-space for things used internally in this module. 
 * @type {Object}
 */
var internals = {};


/* **************************************************************************
 * SysError                                                            */ /**
 *
 * Constructor function for the SysError class.
 *
 * @constructor
 *
 ****************************************************************************/
internals.SysError = function(code, status, message)
{
    /**
     * The '@type' property must be the value 'SysError' to identify this
     * object as a SysError w/o depending on the class hierarchy. This is
     * property is included in the serialized object when this instance
     * is serialized to JSON.
     * @const
     * @type {string}
     */
    this['@type'] = 'SysError';

    /**
     *  Error code as specified in the /resources/brix-errors_en.json (in the server).
     * @type {string}
     */
    this.code = code;

    /**
     * The HTTP status code that reflects the error, or 900 
     * if it's a network error (I.e. could not even get response from server).
     * @type {number}
     */
    this.status = status;

    /**
     * End-user friendly error message.
     * @type {string}
     */
    this.message = message;

};

//module.exports.SysError.prototype = new Error();

/* **************************************************************************
 * SysError.createFromObject
 * 
 * Create a new SysError instance from an object w/ the necessary properties.
 * The object should contain the property '@type' with the value 'SysError'. 
 *
 * @param {Object} error     The object that will be used to create the SysError
 *                           if it contains the necessary properties.
 *                           THe error object can also be of type Error, in
 *                           this case, the method will return SysError 
 *                           object that wraps around error's message.
 *
 * @returns {?SysError} a new SysError w/ properties initialized
 * from the given error object, or null if the given object didn't have the
 * necessary properties.
 */
internals.SysError.createFromObject = function(error)
{
    if (error instanceof Error)
    {
        // It is a native Error object, E-RTN000 means Runtime error
        return new internals.SysError('E-RNT000',
                500,
                'Runtime Error: ' + error.message,
                {
                    description: error.toString(),
                    stack: error.stack
                }
            );
    }
    else
    {
        if (error['@type'] === 'SysError')
        {
            return new internals.SysError(error.code,
                                              error.status,
                                              error.message,
                                              error.details);
        }
    }

    return null;
};


/***************************************************************************
 * toJSON
 *
 * Get a JSON ready object containing the properties of this SysError.
 *
 * @returns {Object} an object with JSON ready property values.
 *
 */
internals.SysError.prototype.toJSON = function ()
{
    var jsonError = {
            '@type': this['@type'],
            'code': this.code,
            'status': this.status,
            'message': this.message,
            'errors': this.errors
        };

    return jsonError;
};

module.exports.SysError = internals.SysError;
