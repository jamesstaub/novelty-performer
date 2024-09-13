var times = [] // array of milisecond times
var allowedSubdivs = [4, 2, 1, .5, .33, .25, .125, .0625]
var subdivOfTimes = []
var timeStats = []

var bpm = 120

var subdivsDict = new Dict("subdivs");
var meantimesDict = new Dict("meantimes");

function list() {
    times = arrayfromargs(arguments);
    bang()
}

function bang() {
    bpm = findTempoFromSubdivisions(times);
	outlet(0, bpm);
}

function findTempoFromSubdivisions() {
    var longestTime = range(times)[1];

    // TODO: pluck off longest/shortest values if they are wayy off from the rest
    // (using variance maybe?)
    
    setSubdivOfTimes(longestTime)
    
    setSubdivStats(mean)
    
	//outlet(0, timeStats[0])
    
    // post("variance  " + variance(times) + "\n");
    // post("median  " + median(times) + "\n");
    // post("stddev  " + stddev(times) + "\n");
    // post("mode  " + mode(times)[0] + "\n");

    timeStats.forEach(function (time, idx) {
        meantimesDict.set(idx, time)
    })

    subdivOfTimes.forEach(function (arr, idx) {
        subdivsDict.set(idx, arr)
    })
    
    return bpm;
}

/**
    create a hash keyed on subdivision ratios
    with arrays of each received time closest to it
     * {
    *  1: [],
    *  .5: [],
    *  .25: [],
    * }
*/
function setSubdivOfTimes(base) {    
    var subDivsOfBase = allowedSubdivs
        .map(function(subdiv, idx){
            // initiate the object that will collect closest matches
            subdivOfTimes[idx] = []
            return base * subdiv
        })
    
    times.forEach(function(time) {
        // which subdivision of the base time is the current time value closest to
        var closestSubdivTime = closest(subDivsOfBase, time);
        var idxOfClosest = subDivsOfBase.indexOf(closestSubdivTime)
        subdivOfTimes[idxOfClosest].push(time);
    });
}


/**
 * 
 * loop over subDiv of times object
 * set the same keys with the given stat for their previous value
 * (mean/mode etc)
 */
function setSubdivStats(statFn) {
    subdivOfTimes.forEach(function(arrayOfTimes, idx){
        if (arrayOfTimes.length) {
            timeStats[idx] = statFn(arrayOfTimes);
        } else {
            timeStats[idx] = 0;
        }
    })
}

/**
 * 
 * Stats 
 */

function closest(counts, goal) {
    return counts.reduce(function(prev, curr) {
        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
}

function mean(arr) {
    // Creating the mean with Array.reduce
    return arr.reduce(function (acc, curr){
        return acc + curr;
    }, 0) / arr.length;
}

function variance(arr){
    
    // Assigning (value - mean) ^ 2 to every array item
    arr = arr.map(function (k) {
      return Math.pow((k - mean(arr)), 2);
    })
    
    // Calculating the sum of updated array
   var sum = arr.reduce(function(acc, curr) { return acc + curr}, 0 );

   // Calculating the variance
   var variance = sum / arr.length;
   
   return variance;
  }
   
  function stddev(arr) {
    return Math.sqrt(variance(arr))
  }

  function median(numbers) {
    // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
    var median = 0, numsLen = numbers.length;
    numbers.sort();
 
    if (
        numsLen % 2 === 0 // is even
    ) {
        // average of two middle numbers
        median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else { // is odd
        // middle number only
        median = numbers[(numsLen - 1) / 2];
    }
 
    return median;
}
 
/**
 * The "mode" is the number that is repeated most often.
 *
 * For example, the "mode" of [3, 5, 4, 4, 1, 1, 2, 3] is [1, 3, 4].
 *
 * @param {Array} numbers An array of numbers.
 * @return {Array} The mode of the specified numbers.
 */
function mode(numbers) {
    // as result can be bimodal or multi-modal,
    // the returned result is provided as an array
    // mode of [3, 5, 4, 4, 1, 1, 2, 3] = [1, 3, 4]
    var modes = [], count = [], i, number, maxIndex = 0;
 
    for (i = 0; i < numbers.length; i += 1) {
        number = numbers[i];
        count[number] = (count[number] || 0) + 1;
        if (count[number] > maxIndex) {
            maxIndex = count[number];
        }
    }
 
    for (i in count)
        if (count.hasOwnProperty(i)) {
            if (count[i] === maxIndex) {
                modes.push(Number(i));
            }
        }
 
    return modes;
}
 
/**
 * The "range" of a list a numbers is the difference between the largest and
 * smallest values.
 *
 * For example, the "range" of [3, 5, 4, 4, 1, 1, 2, 3] is [1, 5].
 *
 * @param {Array} numbers An array of numbers.
 * @return {Array} The range of the specified numbers.
 */
function range(numbers) {
    numbers.sort();
    return [numbers[0], numbers[numbers.length - 1]];
}
