function getGroupByTime(filter) {
    switch (filter) {
        case 'this_year':
        case 'last_month':
        case 'this_month':
            return { $month: "$createdAt" }; // nhóm theo tháng
        case 'this_week':
        case 'custom':
        case 'today':
            return { $dayOfMonth: "$createdAt" }; // nhóm theo ngày
        default:
            return { $dayOfMonth: "$createdAt" };
    }
}

module.exports = {getGroupByTime}


