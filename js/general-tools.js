/**
 * General functions for generating icons, dates, etc.
 */

function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function getStatusIcon(status) {
    switch(status){
        case 'requested':
        case 'started': return 'fa-spinner fa-spin';
        case 'success': return 'fa-check-circle';
        case 'warnings': return 'fa-exclamation-circle';
        case 'critical':
        case 'failed':
        default: return 'fa-times-circle';
    }
}
