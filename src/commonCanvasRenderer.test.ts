import { CommonCanvasRenderer } from './commonCanvasRenderer';

describe('CommonCanvasRenderer', () => {
    beforeEach(() => {
        mockContext = {
            scale: jest.fn(),
            translate: jest.fn(),
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            fillText: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
        mockCanvas = {
            getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
        renderer = new CommonCanvasRenderer<null>(mockCanvas, dpr, false);
    });

    afterEach(() => {
        jest.resetAllMocks(); // reset spies
    });

    const dpr = 2;
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let renderer: CommonCanvasRenderer<null>;

    describe('fixScale', () => {
        it('set the scale on the canvas to the device pixel ratio', () => {
            renderer.fixScale();

            expect(mockContext.scale).toHaveBeenCalledWith(dpr, dpr);
        });
    });
});
