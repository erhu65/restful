// 實現一個等待函數
const delay = (interval) => {
    return new Promise((resolve) => {
            setTimeout(resolve, interval);
});
};

const main = async () => {
    console.log('Starting...');

    // 等待五秒
    await delay(5000);

    console.log('Done after five seconds')
};

main();
