const _ = require('lodash')
const getInfoData = ({ fildes = [], object = {} }) => {
    return _.pick(object, fildes)
}
module.exports = { getInfoData }