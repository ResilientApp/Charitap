function test(){
    const a = 0.1;
    return a;
}

var c = test();
var donation = Math.ceil(c) - c;
console.log(donation);