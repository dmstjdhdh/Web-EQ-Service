export const mapValue = (value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number): number => {
    return (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin) + outputMin;
};
