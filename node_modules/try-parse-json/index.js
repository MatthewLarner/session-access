module.exports = function (json, reviver){
    try {
        return JSON.parse(json, reviver);
    } catch(error){
        return error;
    }
};
