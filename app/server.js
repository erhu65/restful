async function get() {

    console.log('get');
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("seceret1"), 100)
    });
}

async function process(value) {
    console.log('process');
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(`${value}-seceret2`), 100)
    });
}


async function main() {
    let val = await get();
    let result = await process(val);
    console.log(result)
}
main();



