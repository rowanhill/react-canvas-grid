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
import { getColumns, getData, TextPair } from './Autofill.data';

type AutofillMode = 'none' | 'single' | 'multi';

interface AutofillableGridState {
    data: Array<DataRow<TextPair>>;
    columns: ColumnDef[];
    autofillMode: AutofillMode;
}

const shouldAllowAutofillMethods: { [mode in AutofillMode]: (selectRange: SelectRange) => boolean } = {
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

export class AutofillGrid extends React.Component<{}, AutofillableGridState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            data: getData(),
            columns: getColumns(),
            autofillMode: 'multi',
        };
    }

    public render() {
        return (
            <>
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
                        shouldAllowAutofill={shouldAllowAutofillMethods[this.state.autofillMode]}
                        onAutofill={this.onAutofill}
                        frozenCols={1}
                        frozenRows={1}
                    />
                </FixedSizeHolder>
            </>
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
