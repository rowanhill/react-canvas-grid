import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { execRaf, mockRaf, resetRaf } from './rafTestHelper';

class TestRenderer extends CommonCanvasRenderer<null> {
    public translate(): void {
        this.context.translate(123, 456);
    }
}

describe('CommonCanvasRenderer', () => {
    beforeEach(() => {
        mockContext = {
            scale: jest.fn(),
            translate: jest.fn(),
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            fillText: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
        mockCanvas = {
            getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
        renderer = new TestRenderer('test', mockCanvas, dpr, false);

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
        it('scales the context, translates and then restores to the previous state', () => {
            renderer.drawScaled(() => { /* no op */});
            execRaf();

            expect(mockContext.save).toHaveBeenCalledTimes(2);
            expect(mockContext.scale).toHaveBeenCalledWith(dpr, dpr);
            expect(mockContext.translate).toHaveBeenCalledWith(123, 456);
            expect(mockContext.restore).toHaveBeenCalledTimes(2);
        });
    });
});
