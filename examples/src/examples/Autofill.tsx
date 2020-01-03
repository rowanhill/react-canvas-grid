import * as React from 'react';
import {
    AutofillContext,
    CellDef,
    ColumnDef,
    DataRow,
    ReactCanvasGrid,
    repeatSelectionIntoFill,
    SelectRange,
} from 'react-canvas-grid';
import { ControlsForm, InlineGroup, RadioInputs } from '../components/ControlsForm';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeColumns, createFakeData } from '../data/dataAndColumns';

type TextPair = [string, string];

type AutofillMode = 'none' | 'single' | 'multi';

interface AutofillableGridState {
    data: Array<DataRow<TextPair>>;
    columns: ColumnDef[];
    autofillMode: AutofillMode;
}

const numRows = 100;
const numCols = 200;

// Hash one int into another - just a cheap way of producing random-looking but deterministic numbers
/* tslint:disable:no-bitwise */
function hash(x: number): number {
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = (x >> 16) ^ x;
    return x;
}
/* tslint:enable:no-bitwise */

function getRandomTextA(x: number, y: number): string {
    return hash(x + y * numCols + 1).toString(36).substr(0, 3);
}
function getRandomTextB(x: number, y: number): string {
    return hash(x + y * numCols + numRows * numCols + 1).toString(36).substr(0, 3);
}

function getTextPair(x: number, y: number): TextPair {
    return [getRandomTextA(x, y), getRandomTextB(x, y)];
}

export class AutofillableGrid extends React.Component<{}, AutofillableGridState> {
    private readonly showAllowAutofillMethods: { [mode in AutofillMode]: (selectRange: SelectRange) => boolean };

    constructor(props: {}) {
        super(props);

        const options: Partial<CellDef<TextPair>> = {
            getText: ([a, b]: TextPair) => `${a}/${b}`,
        };

        this.state = {
            data: createFakeData(numRows, numCols, (x, y) => getTextPair(x, y), options),
            columns: createFakeColumns(numCols),
            autofillMode: 'multi',
        };

        this.showAllowAutofillMethods = {
            none: (_) => {
                return false;
            },
            single: (selectRange: SelectRange) => {
                const width = selectRange.bottomRight.x - selectRange.topLeft.x + 1;
                const height = selectRange.bottomRight.y - selectRange.topLeft.y + 1;
                const numCells = width * height;
                return numCells === 1;
            },
            multi: (_) => {
                return true;
            },
        };
    }

    public render() {
        return (
            <PaddedPage>
                <h1>Autofill</h1>
                <p>
                    ReactCanvasGrid can 'autofill' values - i.e. copy the values from the current
                    selection into a new area - when the autofill handle is dragged to define the new area.
                    The callback <code>shouldAllowAutofill</code> must be supplied to control when the autofill handle
                    is shown, along with the <code>onAutofill</code> callback to update the data.
                </p>
                <p>
                    The <code>shouldAllowAutofill</code> callback is passed the currently selected range, and
                    must return a boolean (<code>true</code> to show allow autofill and show the autofill
                    handle, <code>false</code> to disallow and hide).
                </p>
                <p>
                    The <code>onAutofill</code> is passed both the currently selected range and the range to be filled,
                    and should update the <code>data</code> prop. ReactCanvasGrid provides
                    the <code>repeatSelectionIntoFill</code> function as a convenience: it takes the selected range,
                    range to be filled, current data, columns, and a 'factory' function; it returns a new
                    copy of the data where the area to be filled has been overwritten with cells created by the
                    'factory' from the selected range.
                </p>
                <p>
                    The factory method could simply clone the source cell, or it could follow more complex logic.
                    In the below example, some cell data (the text after the slash) is treated as invariate by the
                    factory function, and some cell data (the text before the slash) is treated as copyable.
                </p>
                <p>
                    The factory method is passed a single <code>context</code> object, which includes information
                    on the source (from the selection) and destination (from the area to
                    fill): <code>[src|dest]RowIndex</code>, <code>[src|dest]ColIndex</code>,{' '}
                    <code>[src|dest]ColDef</code>, and <code>[src|dest]CellDef</code>.
                </p>

                <ControlsForm>
                    <div>
                        <InlineGroup>
                            <span>Allowed autofill mode: </span>
                            <RadioInputs
                                values={['none', 'single', 'multi']}
                                selectedValue={this.state.autofillMode}
                                onSelect={this.onAutofillModeSelect}
                            />
                        </InlineGroup>
                    </div>
                </ControlsForm>

                <FixedSizeHolder>
                    <ReactCanvasGrid<TextPair>
                        columns={this.state.columns}
                        data={this.state.data}
                        rowHeight={20}
                        shouldAllowAutofill={this.showAllowAutofillMethods[this.state.autofillMode]}
                        onAutofill={this.onAutofill}
                        frozenCols={1}
                        frozenRows={1}
                    />
                </FixedSizeHolder>
            </PaddedPage>
        );
    }

    private onAutofill = (selectRange: SelectRange, fillRange: SelectRange) => {
        const data = repeatSelectionIntoFill(
            selectRange,
            fillRange,
            this.state.data,
            this.state.columns,
            autofillCell,
        );
        this.setState({ data });
    }

    private onAutofillModeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const autofillMode = event.currentTarget.value as AutofillMode;
        this.setState({ autofillMode });
    }
}

function autofillCell(context: AutofillContext<TextPair>): CellDef<TextPair> {
    return {
        ...context.destCellDef,
        data: [context.srcCellDef.data[0], context.destCellDef.data[1]],
    };
}
