import * as React from 'react';
import { AutofillGrid } from './Autofill.grid';
import { AutofillText } from './Autofill.text';
import { CustomBackgroundGrid } from './CustomBackground.grid';
import { CustomBackgroundText } from './CustomBackground.text';
import { CustomTextGrid } from './CustomText.grid';
import { CustomTextText } from './CustomText.text';
import { DynamicDataGrid } from './DynamicData.grid';
import { DyanmicDataText } from './DynamicData.text';
import { EditableDataGrid } from './Editable.grid';
import { EditableDataText } from './Editable.text';
import { EditEventsGrid } from './EditEvents.grid';
import { EditEventsText } from './EditEvents.text';
import { Everything } from './Everything.grid';
import { FocusColumnGrid } from './FocusColumn.grid';
import { FocusColumnText } from './FocusColumn.text';
import { FrozenCellsGrid } from './FrozenCells.grid';
import { FrozenCellsText } from './FrozenCells.text';
import { KeyboardEventsGrid } from './KeyboardEvents.grid';
import { KeyboardEventsText } from './KeyboardEvents.text';
import { SelectionEventsGrid } from './SelectionEvents.grid';
import { SelectionEventsText } from './SelectionEvents.text';
import { SimpleGrid } from './Simple.grid';
import { SimpleText } from './Simple.text';
import { SmallGridGrid } from './SmallGrid.grid';
import { SmallGridText } from './SmallGrid.text';

interface ExampleMeta {
    pathFragment: string;
    name: string;
    description: React.ReactNode;
    grid: React.ComponentType;
    text: React.ComponentType;
    fileName: string;
}

const exampleMeta: ExampleMeta[] = [
    {
        pathFragment: '/full-example',
        name: 'Full Example',
        description: 'A kitchen-sink example, with as many features demonstrated at once as possible.',
        grid: Everything,
        text: () => null,
        fileName: 'Everything',
    },
    {
        pathFragment: '/small',
        name: 'Small Grid',
        description: 'A basic grid setup with minimal data.',
        grid: SmallGridGrid,
        text: SmallGridText,
        fileName: 'SmallGrid',
    },
    {
        pathFragment: '/simple',
        name: 'Simple Grid',
        description: 'A basic grid setup with enough data to need to scroll',
        grid: SimpleGrid,
        text: SimpleText,
        fileName: 'Simple',
    },
    {
        pathFragment: '/editable',
        name: 'Editable Data',
        description: 'A grid with cells backed by data, made editable through a text box',
        grid: EditableDataGrid,
        text: EditableDataText,
        fileName: 'Editable',
    },
    {
        pathFragment: '/frozen',
        name: 'Frozen Rows & Columns',
        description: 'A grid with rows and columns that do not scroll',
        grid: FrozenCellsGrid,
        text: FrozenCellsText,
        fileName: 'FrozenCells',
    },
    {
        pathFragment: '/focused-column',
        name: 'Column Focusing',
        description: 'Automatically scroll to a selected column',
        grid: FocusColumnGrid,
        text: FocusColumnText,
        fileName: 'FocusColumn',
    },
    {
        pathFragment: '/dynamic-data',
        name: 'Dynamic Data',
        description: 'Update the columns and rows provided to the grid component',
        grid: DynamicDataGrid,
        text: DyanmicDataText,
        fileName: 'DynamicData',
    },
    {
        pathFragment: '/custom-bg',
        name: 'Custom Background Renderer',
        description: 'Draw cells with custom backgrounds',
        grid: CustomBackgroundGrid,
        text: CustomBackgroundText,
        fileName: 'CustomBackground',
    },
    {
        pathFragment: '/custom-text',
        name: 'Custom Text Renderer',
        description: 'Draw cells with custom text',
        grid: CustomTextGrid,
        text: CustomTextText,
        fileName: 'CustomText',
    },
    {
        pathFragment: '/selection-events',
        name: 'Selection Events',
        description: 'Respond to users changing the selected area',
        grid: SelectionEventsGrid,
        text: SelectionEventsText,
        fileName: 'SelectionEvents',
    },
    {
        pathFragment: '/keyboard-events',
        name: 'Keyboard Events',
        description: 'Respond to use of the keyboard when the grid is focused',
        grid: KeyboardEventsGrid,
        text: KeyboardEventsText,
        fileName: 'KeyboardEvents',
    },
    {
        pathFragment: '/edit-events',
        name: 'Edit Events',
        description: 'Respond to users changing the grid\'s data',
        grid: EditEventsGrid,
        text: EditEventsText,
        fileName: 'EditEvents',
    },
    {
        pathFragment: '/autofill',
        name: 'Autofill',
        description: 'Autofill',
        grid: AutofillGrid,
        text: AutofillText,
        fileName: 'Autofill',
      },
];

export default exampleMeta;
