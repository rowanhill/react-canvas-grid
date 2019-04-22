const rafCallbacks: FrameRequestCallback[] = [];

let rafId = 0;

export function execRaf() {
    const cb = rafCallbacks.shift();
    if (cb) {
        cb(performance.now() + 7);
    }
}

export function mockRaf() {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb);
        rafId++;
        return rafId;
    });
}

export function resetRaf() {
    (window.requestAnimationFrame as jest.Mock).mockRestore();
}
