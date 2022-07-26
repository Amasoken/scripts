/**
 * Small util to count pixel perfect wallpaper size by proportions and one side.
 * Since I tend to work on a bigger canvas,
 * I need to find the right size so the picture can be resized to a certain size perfectly.
 */

const HD = { x: 1920, y: 1080 };
const HD_REALME = { x: 1080, y: 2400 };

const steps = {
    lesser: -1,
    bigger: 1,
};

const calculateRoundProportions = (sideToFind, { x: a, y: b } = HD) => {
    console.log('Proportions: ', a / b, ' or ', b / a);

    const result = {
        lesser: {
            x: sideToFind,
            y: 0,
        },
        bigger: {
            x: sideToFind,
            y: 0,
        },
    };

    for (const key of Object.keys(result)) {
        const step = steps[key];
        let { x, y } = result[key];
        let cycles = 0;
        do {
            x += step;
            y = (x * b) / a;
            cycles++;
        } while (Math.trunc(y) !== y);

        console.log(cycles);

        result[key] = { x, y };
    }

    const currentY = (sideToFind * b) / a;
    if (Math.trunc(currentY) === currentY) result['current'] = { x: sideToFind, y: currentY };

    return result;
};

// 1080, 1920 For HD screen
// 1080, 2400 For some Android phones

const sides = calculateRoundProportions(2100, HD_REALME);
console.log(sides);
