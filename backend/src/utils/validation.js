// Shared request validation helpers used by project and task controllers.
export function isPositiveInteger(value) {
    return /^(?:[1-9]\d*)$/.test(String(value));
}

export function isValidDate(value) {
    if (value === null || value === undefined || value === "") return true;
    const dateValue = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;

    const date = new Date(`${dateValue}T00:00:00Z`);
    return (
        date.getUTCFullYear() === Number(dateValue.slice(0, 4)) &&
        date.getUTCMonth() + 1 === Number(dateValue.slice(5, 7)) &&
        date.getUTCDate() === Number(dateValue.slice(8, 10))
    );
}
