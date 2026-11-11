const countRange = (low: number, high: number) => (low >= high ? `${high}` : `${low}–${high}`);

export default countRange;
