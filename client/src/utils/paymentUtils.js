export const CHARGE_TABLE = [
    { min: 100, max: 800, charge: 10 },
    { min: 801, max: 1000, charge: 15 },
    { min: 1001, max: 1500, charge: 20 },
    { min: 1501, max: 2000, charge: 25 },
    { min: 2001, max: 2500, charge: 30 },
    { min: 2501, max: 3000, charge: 35 },
    { min: 3001, max: 3500, charge: 40 },
    { min: 3501, max: 4000, charge: 45 },
    { min: 4001, max: 4500, charge: 50 },
    { min: 4501, max: 5000, charge: 55 },
    { min: 5001, max: 6000, charge: 60 },
    { min: 6001, max: 7000, charge: 65 },
    { min: 7001, max: 8000, charge: 70 },
    { min: 8001, max: 9000, charge: 75 },
    { min: 9001, max: 10000, charge: 80 },
];

export const getExtraCharge = (amount) => {
    const row = CHARGE_TABLE.find((r) => amount >= r.min && amount <= r.max);
    return row ? row.charge : 0;
};
