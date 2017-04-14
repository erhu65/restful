function get() {

    console.log('get');
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("seceret1"), 100)
    });
}

function process(value) {
    console.log('process');
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(`${value}-seceret2`), 100)
    });
}


function main() {
    get().then(process).then(result => console.log(result));
}
main();



