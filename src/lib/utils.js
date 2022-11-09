'use strict'

define(function(){
    var secondsToHuman = function(seconds) {
        if (seconds == 0) return "Just now";
        if (seconds / 60 / 60 / 24 / 365 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24 / 365);
            return num + ' year' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 / 24 / 30 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24 / 30);
            return num + ' month' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 / 24 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24);
            return num + ' day' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 > 1) {
            var num = Math.round(seconds / 60 / 60);
            return num + ' hour' + ((num > 1) ? 's': '');
        }
        else if (seconds / 60 > 1) {
            var num  = Math.round(seconds / 60);
            return num + ' minute' + ((num > 1) ? 's': '');
        }
        else {
            return Math.round(seconds) + ' second' + ((seconds >= 2) ? 's': '');
        }
    }

    var replacer = function(match, pIndent, pKey, pVal, pEnd) {
        var key = '<span class=json-key>';
        var val = '<span class=json-value>';
        var str = '<span class=json-string>';
        var r = pIndent || '';
        if (pKey)
           r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
        if (pVal)
           r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
        return r + (pEnd || '');
    }

    var prettyPrint = function(obj) {
        if (obj == null) return;
        var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
        return JSON.stringify(obj, null, 3)
           .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
           .replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(jsonLine, replacer);
    }

    var dateSimpleFormat = function(date) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }

    var timeDateFormat = function(date) {
      var hours, ampm;
      if (date.getHours() >= 12) {
        hours = date.getHours() - 12;
        ampm = "pm"
      } else {
        hours = date.getHours();
        ampm = "am"
      }

      var minutes = date.getMinutes();
      if (minutes < 10) {
        minutes = "0" + minutes;
      }

      return hours + ":" + minutes + " " + ampm + " - " + date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
    }

    var dateFormat = function(date) {
      return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
    }

    var dateToLogDateFormat = function(date) {
      var dd = date.getDate();
      var mm = date.getMonth()+1; //January is 0!
      var yyyy = date.getFullYear();
      if(dd<10) {
          dd = '0'+dd
      }
      if(mm<10) {
          mm = '0'+mm
      }
      return yyyy + '-' + mm + '-' + dd;
    }

    var getTodaysDate = function() {
      var today = new Date();
      return dateToLogDateFormat(today);
    }

    function getDaysOfWeek() {
      var daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      var offsetDaysOfWeek = [];
      var d = new Date();
      var day = d.getDay();
      for (var b = 0; b < 2; b++) {
        for (var a = day; offsetDaysOfWeek.length < 14; ){
          if (a == 6) {
            a = 0
          } else {
            a++
          }
          offsetDaysOfWeek.push(daysOfWeek[a]);
        }
      }
      return offsetDaysOfWeek;
    }

    function getReadableFileSizeString(fileSizeInBytes) {
      var i = -1;
      var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
      do {
        fileSizeInBytes /= 1024;
        i++;
      } while (fileSizeInBytes > 1024);

      return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
    }

    return {
        secondsToHuman: secondsToHuman,
        prettyPrint: prettyPrint,
        dateSimpleFormat: dateSimpleFormat,
        getTodaysDate: getTodaysDate,
        timeDateFormat: timeDateFormat,
        dateFormat: dateFormat,
        dateToLogDateFormat: dateToLogDateFormat,
        getDaysOfWeek: getDaysOfWeek,
        getReadableFileSizeString: getReadableFileSizeString
    }
})
