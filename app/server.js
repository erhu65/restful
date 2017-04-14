function get(callback) {

    console.log('get');
    return setTimeout(() => callback("seceret1"), 100);
}

function process(value, callback) {
    console.log('process');
    return setTimeout(() => callback(`${value}-seceret2`), 100);
}


function main() {
    get(value => process(value, result => console.log(result)));
}
main();



