
export function validUrlParams({ value }: { value: unknown }): boolean {
    if (value || typeof value === "string") {
        return true;
    }
    return false;
}

