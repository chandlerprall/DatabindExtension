module.exports = function seriesToString(funcArray, cb, index = 0, results = '') {
    if (index < funcArray.length) {
        funcArray[index]((err, result) => {
            if (!!err) {
                return cb(err, results);
            }

            results += result;
            seriesToString(funcArray, cb, index + 1, results);
        });
    } else {
        return cb(null, results);
    }
};