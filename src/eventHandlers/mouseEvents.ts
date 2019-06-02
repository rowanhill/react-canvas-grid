export function isLeftButton(event: React.MouseEvent<any, any>): boolean {
    // tslint:disable-next-line: no-bitwise
    return (event.buttons & 1) === 1;
}
