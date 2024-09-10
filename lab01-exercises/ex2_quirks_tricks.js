/*
  Exercise 2
  JavaScript quirks and tricks
*/

var schoolName = "Parsons";
var schoolYear = 1936;

// Task
// What is the value of test3?
var test1;
if (1 == true) {
  test1 = true;
} else {
  test1 = false;
}

var test2;
if (1 === true) {
  test2 = true;
} else {
  test2 = false;
}

var test3 = test1 === test2;
console.log(test3)
// false

// Task
// Change this code so test4 is false and test5 is true. Use console.log() to confirm your cod works.

var test4 = 0 === "0"; // === exacly equal
var test5 = 1 == "1"; // == equal

console.log("test4 is", test4, "and test 5 is", test5);

// Task
// What are the values of p, q, and r? Research what is going on here.
var w = 0.1;
var x = 0.2;
var y = 0.4;
var z = 0.5;

var p = w + x; 
console.log(p)
// 0.30000000000000004 -- floating number

var q = z - x;
console.log(q)
// 0.3

var r = y - w;
console.log(r)
// 0.30000000000000004