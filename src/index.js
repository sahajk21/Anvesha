// Configuration variables
siteName = window.SITE_NAME || "Anvesha";
defaultLanguages = window.PREFERRED_LANGUAGES || [];
resultsPerPage = window.RESULTS_PER_PAGE || 200;
favicon = window.FAVICON || "images/favicon.png";
logo = window.LOGO || "images/logo.png";
mainPageText = window.MAIN_PAGE_TEXT || null;
classes = window.SUGGESTED_CLASSES.map(function(v){return {value:v}}) || [];
veryLargeClasses = window.VERY_LARGE_CLASSES || [];
unknowablyLargeClasses = window.UNKNOWABLY_LARGE_CLASSES || [];
sparqlEndpoint = window.SPARQL_ENDPOINT || "https://query.wikidata.org/sparql?query=";
centralSPARQLService = window.CENTRAL_SPARQL_SERVICE || null;
centralSPARQLEndpoint = centralSPARQLService ? centralSPARQLService + '?query=' : sparqlEndpoint;
queryServiceWebsiteURL = window.QUERY_SERVICE_WEBSITE_URL || "https://query.wikidata.org/#";
entityAPIURL = window.ENTITY_API_URL || 'https://www.wikidata.org/w/api.php';
instanceOf = window.INSTANCE_OF_PID || "P31";
propertiesForThisType = window.PROPERTIES_FOR_THIS_TYPE_PID || "P1963";
subclassOf = window.SUBCLASS_OF_PID || "P279";
propertyConstraint = window.PROPERTY_CONSTRAINT_PID || "P2302";
classProperty = window.CLASS_PID || "P2308";
distinctValuesConstraint = window.DISTINCT_VALUES_CONSTRAINT || "Q21502410";
valueTypeConstraint = window.VALUE_TYPE_CONSTRAINT || "Q21510865";
fallbackQueryLimit = window.FALLBACK_QUERY_LIMIT || 300;
linksInTopNav = window.LINKS_IN_TOPNAV || {};
itemURLStart = window.ITEM_URL_START || "https://www.wikidata.org/wiki/";
showThumbnails = window.SHOW_THUMBNAILS || false;
thumbnailURLStart = window.THUMBNAIL_URL_START;
classlessFilters = window.CLASSLESS_FILTERS || null;
noClasses = classlessFilters !== null;
wikidataMonthIDs = [ 'Q108', 'Q109', 'Q110', 'Q118', 'Q119', 'Q120', 'Q121', 'Q122', 'Q123', 'Q124', 'Q125', 'Q126' ];

// Website name
document.title = siteName

// Set favicon dynamically
var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
link.rel = 'shortcut icon';
link.href = favicon;
document.getElementsByTagName('head')[0].appendChild(link);

// URL Parameters
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

// Language
var languages = ["en","ceb","sv","de","fr","nl","ru","it","es","pl","war","vi","ja","zh",
                "arz","ar","uk","pt","fa","ca","sr","id","no","ko","fi","hu","cs","sh","ro","nan",
                "tr","eu","ms","ce","eo","he","hy","bg","da","azb","sk","kk","min","hr","et","lt","be","el","az",
                "sl","gl","ur","nn","nb","hi","ka","th","tt","uz","la","cy","ta","vo","mk","ast","lv","yue","tg",
                "bn","af","mg","oc","bs","sq","ky","nds","new","be-tarask","ml","te","br","tl","vec","pms","mr",
                "su","ht","sw","lb","jv","sco","pnb","ba","ga","szl","is","my","fy","cv","lmo","wuu","bn"]
var langArray = defaultLanguages.concat(languages.filter(x => !defaultLanguages.includes(x)))
var lang = urlParams.get('lang') ? urlParams.get('lang') + "," + langArray.join(",") : langArray.join(",");
var primaryLang = urlParams.get('lang') ? urlParams.get('lang') : langArray[0];
const rtlLanguages = ["ar", "arz", "azb", "fa", "he", "ur"];
var arrow = ' &rarr; ';// Arrow Direction
if(rtlLanguages.includes(primaryLang)){
    document.getElementsByTagName("body")[0].setAttribute("dir", "rtl");
    arrow = ' &larr; ';
}

// History logging
(function (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({ state: state });
        }
        return pushState.apply(history, arguments);
    }
})(window.history);

// Caching
cachedFilterValues = {};

// Bucket creation and number formatting
var gBucketsPerFilter = 10;

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function NumberRange(lowNumber, highNumber) {
    this.lowNumber = lowNumber;
    this.highNumber = highNumber;
}
NumberRange.fromString = function (filterText) {
    var numberRange = new NumberRange();
    filterText = String(filterText);
    var numbers = filterText.split(' - ');
    if (numbers.length == 2) {
        numberRange.lowNumber = parseFloat(numbers[0]);
        numberRange.highNumber = parseFloat(numbers[1]);
    } else {
        numberRange.lowNumber = parseFloat(filterText);
        numberRange.highNumber = null;
    }
    return numberRange;
}
NumberRange.prototype.toString = function () {
    if (this.highNumber == null) {
        return numberWithCommas(this.lowNumber);
    } else {
        return numberWithCommas(this.lowNumber) + " - " + numberWithCommas(this.highNumber);
    }
}
function getNearestNiceNumber(num, previousNum, nextNum) {
    if (previousNum == null) {
        var smallestDifference = nextNum - num;
    } else if (nextNum == null) {
        var smallestDifference = num - previousNum;
    } else {
        var smallestDifference = Math.min(num - previousNum, nextNum - num);
    }

    var base10LogOfDifference = Math.log(smallestDifference) / Math.LN10;
    var significantFigureOfDifference = Math.floor(base10LogOfDifference);

    var powerOf10InCorrectPlace = Math.pow(10, Math.floor(base10LogOfDifference));
    var significantDigitsOnly = Math.round(num / powerOf10InCorrectPlace);
    var niceNumber = significantDigitsOnly * powerOf10InCorrectPlace;

    // Special handling if it's the first or last number in the series -
    // we have to make sure that the "nice" equivalent is on the right
    // "side" of the number.

    // That's especially true for the last number -
    // it has to be greater, not just equal to, because of the way
    // number filtering works.
    // ...or does it??
    if (previousNum == null && niceNumber > num) {
        niceNumber -= powerOf10InCorrectPlace;
    }
    if (nextNum == null && niceNumber < num) {
        niceNumber += powerOf10InCorrectPlace;
    }

    // Now, we have to turn it into a string, so that the resulting
    // number doesn't end with something like ".000000001" due to
    // floating-point arithmetic.
    var numDecimalPlaces = Math.max(0, 0 - significantFigureOfDifference);
    return niceNumber.toFixed(numDecimalPlaces);
}
function generateIndividualFilterValuesFromNumbers(uniqueValues, unit) {
    // Unfortunately, object keys aren't necessarily cycled through
    // in the correct order - put them in an array, so that they can
    // be sorted.
    var uniqueValuesArray = [];
    for (uniqueValue in uniqueValues) {
        uniqueValuesArray.push(uniqueValue);
    }

    // Sort numerically, not alphabetically.
    uniqueValuesArray.sort(function (a, b) { return a - b; });

    var propertyValues = [];
    for (i = 0; i < uniqueValuesArray.length; i++) {
        var uniqueValue = uniqueValuesArray[i];
        var curBucket = {};
        curBucket['bucketName'] = numberWithCommas(uniqueValue);
        curBucket['numValues'] = uniqueValues[uniqueValue];
        curBucket['bucketUL'] = uniqueValue;
        curBucket['bucketLL'] = uniqueValue;
        curBucket['unit'] = unit;
        propertyValues.push(curBucket);
    }
    return propertyValues;
}
function generateFilterValuesFromNumbers(numberArray, unit = '') {
    var numNumbers = numberArray.length;
    // First, find the number of unique values - if it's the value of
    // gBucketsPerFilter, or fewer, just display each one as its own
    // bucket.
    var numUniqueValues = 0;
    var uniqueValues = {};
    for (i = 0; i < numNumbers; i++) {
        var curNumber = Number(numberArray[i].amount.value);
        if (!uniqueValues.hasOwnProperty(curNumber)) {
            uniqueValues[curNumber] = 1;
            numUniqueValues++;
            if (numUniqueValues > gBucketsPerFilter) continue;
        } else {
            // We do this now to save time on the next step,
            // if we're creating individual filter values.
            uniqueValues[curNumber]++;
        }
    }
    if (numUniqueValues <= gBucketsPerFilter) {
        return generateIndividualFilterValuesFromNumbers(uniqueValues, unit);
    }
    var propertyValues = [];
    var separatorValue = Number(numberArray[0].amount.value);
    // Make sure there are at least, on average, five numbers per bucket.
    // HACK - add 3 to the number so that we don't end up with just one
    // bucket ( 7 + 3 / 5 = 2).
    var numBuckets = Math.min(gBucketsPerFilter, Math.floor((numNumbers + 3) / 5));
    var bucketSeparators = [];
    bucketSeparators.push(Number(numberArray[0].amount.value));
    for (i = 1; i < numBuckets; i++) {
        separatorIndex = Math.floor(numNumbers * i / numBuckets) - 1;
        previousSeparatorValue = separatorValue;
        separatorValue = Number(numberArray[separatorIndex].amount.value);
        if (separatorValue == previousSeparatorValue) {
            continue;
        }
        bucketSeparators.push(separatorValue);
    }
    if (separatorValue != Number(numberArray[numberArray.length - 1].amount.value)) {
        bucketSeparators.push(Math.ceil(Number(numberArray[numberArray.length - 1].amount.value)));
    }
    bucketSeparators.sort(function (a, b) { return a - b });
    // Get the closest "nice" (few significant digits) number for each of
    // the bucket separators, with the number of significant digits
    // required based on their proximity to their neighbors.
    // The first and last separators need special handling.
    bucketSeparators[0] = getNearestNiceNumber(bucketSeparators[0], null, bucketSeparators[1]);
    for (i = 1; i < bucketSeparators.length - 1; i++) {
        bucketSeparators[i] = getNearestNiceNumber(bucketSeparators[i], bucketSeparators[i - 1], bucketSeparators[i + 1]);
    }

    bucketSeparators[bucketSeparators.length - 1] = getNearestNiceNumber(bucketSeparators[bucketSeparators.length - 1], bucketSeparators[bucketSeparators.length - 2], null);
    var oldSeparatorValue = bucketSeparators[0];
    var separatorValue;
    for (i = 1; i < bucketSeparators.length; i++) {
        separatorValue = bucketSeparators[i];
        var curBucket = {};
        curBucket['numValues'] = 0;
        var curFilter = new NumberRange(oldSeparatorValue, separatorValue);
        curBucket['bucketName'] = curFilter.toString();
        curBucket['bucketLL'] = curFilter.lowNumber;
        curBucket['bucketUL'] = curFilter.highNumber;
        curBucket['unit'] = unit;
        propertyValues.push(curBucket);
        oldSeparatorValue = separatorValue;
    }
    var curSeparator = 0;
    for (i = 0; i < numberArray.length; i++) {
        if (curSeparator < propertyValues.length - 1) {
            var curNumber = Number(numberArray[i].amount.value);
            while (curNumber >= bucketSeparators[curSeparator + 1]) {
                curSeparator++;
            }
        }
        propertyValues[curSeparator]['numValues']++;
    }
    return propertyValues;
}
function monthNumberToString(monthNum) {
    if (monthNum >= 1 && monthNum <= 12) {
        return wikidataMonthIDs[monthNum - 1];
    }
    return 'Invalid month - ' + monthNum;
}
function yearToBCFormat(year) {
    if (Number(year) < 0) {
        return (Number(year) * -1) + " BC"
    }
    return year
}
function getDateObject(dateStr) {
    s = dateStr.split("-")
    if (s.length == 3) {
        if ( s[0] == '0000' ) {
            // There's no "year 0", right?
            return null;
        }
        return { year: s[0], month: s[1], day: s[2] }
    }
    else {
        if ( Number(s[1]) > 15000000000 ) {
          // Older than the universe - presumably this is an incorrect value.
          return null;
        }
        return { year: "-" + "0".repeat(6 - s[1].length) + s[1], month: s[2], day: s[3] }
    }
}

function generateDateBuckets(rawData) {
    dates = []
    for (let i = 0; i < rawData.length; i++) {
        if (rawData[i].time.hasOwnProperty("datatype")) {
            dateStr = rawData[i].time.value.split("T")[0];
            var dateObj = getDateObject(dateStr);
            if ( dateObj == null ) {
                continue;
            }
            dates.push(dateObj);
        }
    }
    var earliestYear = Number(dates[0].year);
    var earliestMonth = Number(dates[0].month);
    var earliestDay = Number(dates[0].day);
    var latestYear = Number(dates[dates.length - 1].year);
    var latestMonth = Number(dates[dates.length - 1].month);
    var latestDay = Number(dates[dates.length - 1].day);
    var yearDifference = latestYear - earliestYear;
    var monthDifference = (12 * yearDifference) + (latestMonth - earliestMonth);
    var dayDifference = (30 * monthDifference) + (latestDay - earliestDay);
    var propertyValues = [];
    var possibleBucketSizes = [
        { minYearDifference: 3000, bucketSize: 1000 },
        { minYearDifference: 300, bucketSize: 100 },
        { minYearDifference: 150, bucketSize: 50 },
        { minYearDifference: 80, bucketSize: 10 },
        { minYearDifference: 15, bucketSize: 5 },
    ];

    for (var i = 0; i < possibleBucketSizes.length; i++) {
        if (yearDifference <= possibleBucketSizes[i].minYearDifference) {
            continue;
        }
        var bucketSize = possibleBucketSizes[i].bucketSize;
        curYear = iniYear = Math.floor(earliestYear / bucketSize) * bucketSize;
        while (curYear <= latestYear) {
            if (curYear < 0) {
                propertyValues.push({
                    bucketName: yearToBCFormat(curYear) + " - " + yearToBCFormat(curYear + bucketSize - 1),
                    bucketLL: { year: curYear, month: "01", day: "01" },
                    bucketUL: { year: curYear + bucketSize - 1, month: "12", day: "31" },
                    size: 1,
                    numValues: 0
                });
            }
            else {
                propertyValues.push({
                    bucketName: (curYear + 1) + " - " + (curYear + bucketSize),
                    bucketLL: { year: curYear + 1, month: "01", day: "01" },
                    bucketUL: { year: curYear + bucketSize, month: "12", day: "31" },
                    size: 1,
                    numValues: 0
                });
            }
            curYear = curYear + bucketSize;
        }
        for (let i = 0; i < dates.length; i++) {
            index = Math.floor((Number(dates[i].year) - iniYear) / bucketSize);
            propertyValues[index].numValues += 1;
        }
        return propertyValues;
    }

    if (yearDifference > 2) {
        curYear = earliestYear;
        while (curYear <= latestYear) {
            propertyValues.push({
                bucketName: yearToBCFormat(curYear),
                bucketLL: { year: curYear, month: "01", day: "01" },
                bucketUL: { year: curYear, month: "12", day: "31" },
                size: 2,
                numValues: 0
            });
            curYear++;
        }
        for (let i = 0; i < dates.length; i++) {
            index = Math.floor(Number(dates[i].year) - earliestYear);
            propertyValues[index].numValues += 1;
        }
    } else if (monthDifference > 1) {
        var curYear = earliestYear;
        var curMonth = earliestMonth;
        while (curYear < latestYear || (curYear == latestYear && curMonth <= latestMonth)) {
            if (curMonth == 2) {
                // Fun with leap years... does this logic apply to BC dates
                // also? Let's just say that it does.
                daysInMonth = ((curYear % 4 == 0 && curYear % 100 != 0) || (curYear % 400 == 0)) ? 29 : 28;
            } else if (curMonth == 4 || curMonth == 6 || curMonth == 9 || curMonth == 11) {
                daysInMonth = 30;
            } else {
                daysInMonth = 31;
            }

            propertyValues.push({
                bucketName: monthNumberToString(curMonth) + " " + yearToBCFormat(curYear),
                bucketLL: { year: curYear, month: curMonth, day: "01" },
                bucketUL: { year: curYear, month: curMonth, day: daysInMonth },
                size: 3,
                numValues: 0
            });
            if (curMonth == 12) {
                curMonth = 1;
                curYear++;
            } else {
                curMonth++;
            }
        }
        for (let i = 0; i < dates.length; i++) {
            index = Math.floor((Number(dates[i].year) - earliestYear) * 12 + Number(dates[i].month) - earliestMonth);
            propertyValues[index].numValues += 1;
        }
    } else if (dayDifference > 1) {
        var curDay = iniDay = earliestDay
        while (curDay <= latestDay) {
            propertyValues.push({
                bucketName: monthNumberToString(earliestMonth) + " " + curDay + ", " + earliestYear,
                bucketLL: { year: earliestYear, month: earliestMonth, day: curDay },
                bucketUL: { year: earliestYear, month: earliestMonth, day: curDay + 1 },
                size: 4,
                numValues: 0
            });
            curDay += 1;
        }
        for (let i = 0; i < dates.length; i++) {
            index = Math.floor(Number(dates[i].day) - iniDay);
            propertyValues[index].numValues += 1
        }
    } else if (dayDifference == 0) {
        propertyValues.push({
            bucketName: monthNumberToString(earliestMonth) + " " + earliestDay + ", " + earliestYear,
            bucketLL: { year: earliestYear, month: earliestMonth, day: earliestDay },
            bucketUL: { year: earliestYear, month: earliestMonth, day: earliestDay + 1 },
            size: 5,
            numValues: dates.length
        });
    }
    return propertyValues;
}

function getTimePrecision(ear, lat, num=0) {
    earliestDate = getDateObject(ear)
    latestDate = getDateObject(lat)
    var earliestYear = earliestDate.year;
    var earliestMonth = earliestDate.month;
    var earliestDay = earliestDate.day;
    var latestYear = latestDate.year;
    var latestMonth = latestDate.month;
    var latestDay = latestDate.day;
    var yearDifference = latestYear - earliestYear;
    var monthDifference = (12 * yearDifference) + (latestMonth - earliestMonth);
    var dayDifference = (30 * monthDifference) + (latestDay - earliestDay);
    if (dayDifference <= 1) return 11+num;
    else if (monthDifference <= 1) return 10+num;
    else if (yearDifference <= 1) return 9+num;
    else if (yearDifference <= 10) return 8+num;
    else if (yearDifference <= 100) return 7+num;
    else if (yearDifference <= 1000) return 6+num;
    else if (yearDifference <= 1e4) return 5+num;
    else if (yearDifference <= 1e5) return 4+num;
    else if (yearDifference <= 1e6) return 3+num;
    else if (yearDifference <= 1e8) return 1+num;
    return 0
}
// Some languages, such as Slovenian, have different words for the plural of
// a noun depending on the number (2, a few, etc.) - handle messages defined
// in this way.
function createPluralMap(pluralValues) {
    pluralMap = {};
    pluralConditions = ['zero=', 'one=', 'two=', 'few=', 'many='];
    pluralConditions.forEach((element, index) => {
        pluralOne = pluralValues.filter((obj)=>{
            return obj.includes(element);
        });
        if (pluralOne.length!==0) {
            pluralMap[index] = pluralOne[0].replace(element, '');
        }
    });
    return pluralMap;
}
function usePluralMap(pluralMap, totalValues ) {
    var str = null;
    var pluralMapKeys = Object.keys(pluralMap);
    if (totalValues == 0 && pluralMapKeys.includes('0')) {
        str = pluralMap[0];
    } else if (totalValues == 1 && pluralMapKeys.includes('1')) {
        str = pluralMap[1];
    } else if (totalValues == 2 && pluralMapKeys.includes('2')) {
        str = pluralMap[2];
    } else if ((totalValues > 2 && totalValues <= 6) && pluralMapKeys.includes('3')) {
        str = pluralMap[3];
    } else if (totalValues > 6 && pluralMapKeys.includes('4')) {
        str = pluralMap[4];
    } else {
        str = pluralMap[pluralMapKeys[0]];
   }
    return str;
}
function displayPluralCount(message, totalValues, addBolding) {
    if (! message) {
        return '';
    }

    matches = message.match('{{PLURAL:[\\s]*\\$1\\|(.*)}}');
    pluralValues = matches[1].split('|')
    var pluralMap = createPluralMap(pluralValues);
    if ( Object.keys(pluralMap).length > 0 ) {
        str = usePluralMap(pluralMap, totalValues);
    } else {
        // We assume the message takes the form "single|multiple".
        str = pluralValues[(totalValues > 1 ? 1 : 0)];
    }
    totalValuesStr = numberWithCommas(totalValues);
    if (addBolding) {
        totalValuesStr = '<b>' + totalValuesStr + '</b>';
    }
    str = str.replace("$1", totalValuesStr);
    return message.replace(/{{PLURAL:[\s]*\$1\|(.*)}}/g, str);
}
