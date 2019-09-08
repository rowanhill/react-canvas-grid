export function isLeftButton(event: MouseEvent | React.MouseEvent<any, any>): boolean {
    // tslint:disable-next-line: no-bitwise
    return (event.buttons & 1) === 1;
}
