

const createResponse = (data, tables = [], options = {}) => {
    const rowCount = Array.isArray(data) ? data.length : (data ? 1 : 0);

    return {
        success: true,
        data,
        meta: {
            source: 'mysql',
            tables: Array.isArray(tables) ? tables : [tables],
            rowCount,
            generated: false,
            timestamp: new Date().toISOString()
        }
    };
};

const createErrorResponse = (message, code = 500) => {
    return {
        success: false,
        error: message,
        meta: {
            source: 'error',
            tables: [],
            rowCount: 0,
            generated: false,
            timestamp: new Date().toISOString()
        }
    };
};

const createEmptyResponse = (tables = []) => {
    return {
        success: true,
        data: [],
        meta: {
            source: 'mysql',
            tables: Array.isArray(tables) ? tables : [tables],
            rowCount: 0,
            generated: false,
            timestamp: new Date().toISOString()
        }
    };
};

module.exports = {
    createResponse,
    createErrorResponse,
    createEmptyResponse
};
