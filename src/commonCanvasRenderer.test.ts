import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { execRaf, mockRaf, resetRaf } from './rafTestHelper';

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

        mockRaf();
    });

    afterEach(() => {
        jest.resetAllMocks(); // reset spies
        resetRaf();
    });

    const dpr = 2;
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let renderer: CommonCanvasRenderer<null>;

    describe('drawScaled', () => {
        it('scales the context and reduces the scale to 1 again', () => {
            renderer.drawScaled(() => { /* no op */});
            execRaf();

            expect(mockContext.scale).toHaveBeenCalledWith(dpr, dpr);
            expect(mockContext.scale).toHaveBeenCalledWith(1 / dpr, 1 / dpr);
        });
    });
});
