function durationDisplay(seconds) {
  const hours=Math.floor(seconds/3600)
  const minutes=Math.floor(seconds/60)%60
  return `${hours>0?hours+':':''}${recko_pad(minutes,2)}:${recko_pad(Math.floor(seconds)%60,2)}`
}
function beginningOfDayEpochSeconds(date) {
  const beginningOfDay=new Date(date)
  beginningOfDay.setHours(0,0,0,0)
  return Math.floor(beginningOfDay.getTime()/1000)
}

function recko_pad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
function localDateFromUtc(dateString) {
  const utcDate=new Date(dateString)
  //return new Date(Date.UTC(utcDate.getFullYear(),utcDate.getMonth(),utcDate.getDate(),utcDate.getHours(),utcDate.getMinutes(),utcDate.getSeconds()))
  return utcDate
}
function getTz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
function getDateDisplay(dateString,withTime=true,timeOnly=false) {
  const tz=getTz()
  const d=localDateFromUtc(dateString)
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec']
  const timeString=withTime ? ` at ${d.toLocaleTimeString('en-US',{timeZone:tz}).replace(/:\d\d\s/,' ')}`:''
  if(timeOnly) return timeString.substring(3)
  return `${months[d.getMonth()]}. ${d.getDate()}, ${d.getFullYear()}${timeString}`
}

/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

// Takes a string representing a UTC timestamp, and returns a string representing how
// long ago the date represents.
function recko_prettyDate(time) { //added a prefix to prevent namespace conflicts
  var date = localDateFromUtc(time),
      diff = (((new Date()).getTime() - date.getTime()) / 1000),
      day_diff = Math.floor(diff / 86400);

  if (isNaN(day_diff) || day_diff < 0) return;
  else if(day_diff >= 31) return getDateDisplay(time,false)

  return day_diff == 0 && (
  diff < 60 && "just now" || diff < 120 && "1 minute ago" || diff < 3600 && Math.floor(diff / 60) + " minutes ago" || diff < 7200 && "1 hour ago" || diff < 86400 && Math.floor(diff / 3600) + " hours ago") || day_diff == 1 && "Yesterday" || day_diff < 7 && day_diff + " days ago" || day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
}

