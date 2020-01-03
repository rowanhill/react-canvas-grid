import * as React from 'react';
import { AutofillableGrid } from './Autofill';
import { CustomBackgroundGrid } from './CustomBackground';
import { CustomTextGrid } from './CustomText';
import { DynamicDataGrid } from './DynamicData';
import { EditableDataGrid } from './Editable';
import { EditEventsGrid } from './EditEvents';
import { Everything } from './Everything';
import { FocusColumnGrid } from './FocusColumn';
import { FrozenCellsGrid } from './FrozenCells';
import { KeyboardEventsGrid } from './KeyboardEvents';
import { SelectionEventsGrid } from './SelectionEvents';
import { SimpleGrid } from './Simple';
import { SmallGrid } from './SmallGrid';

interface ExampleMeta {
    pathFragment: string;
    name: string;
    description: React.ReactNode;
    component: React.ComponentType<any>;
}

const exampleMeta: ExampleMeta[] = [
    {
        pathFragment: '/full-example',
        name: 'Full Example',
        description: 'A kitchen-sink example, with as many features demonstrated at once as possible.',
        component: Everything,
    },
    {
        pathFragment: '/small',
        name: 'Small Grid',
        description: 'A basic grid setup with minimal data.',
        component: SmallGrid,
    },
    {
        pathFragment: '/simple',
        name: 'Simple Grid',
        description: 'A basic grid setup with enough data to need to scroll',
        component: SimpleGrid,
    },
    {
        pathFragment: '/editable',
        name: 'Editable Data',
        description: 'A grid with cells backed by data, made editable through a text box',
        component: EditableDataGrid,
    },
    {
        pathFragment: '/frozen',
        name: 'Frozen Rows & Columns',
        description: 'A grid with rows and columns that do not scroll',
        component: FrozenCellsGrid,
    },
    {
        pathFragment: '/focused-column',
        name: 'Column Focusing',
        description: 'Automatically scroll to a selected column',
        component: FocusColumnGrid,
    },
    {
        pathFragment: '/dynamic-data',
        name: 'Dynamic Data',
        description: 'Update the columns and rows provided to the grid component',
        component: DynamicDataGrid,
    },
    {
        pathFragment: '/custom-bg',
        name: 'Custom Background Renderer',
        description: 'Draw cells with custom backgrounds',
        component: CustomBackgroundGrid,
    },
    {
        pathFragment: '/custom-text',
        name: 'Custom Text Renderer',
        description: 'Draw cells with custom text',
        component: CustomTextGrid,
    },
    {
        pathFragment: '/selection-events',
        name: 'Selection Events',
        description: 'Respond to users changing the selected area',
        component: SelectionEventsGrid,
    },
    {
        pathFragment: '/keyboard-events',
        name: 'Keyboard Events',
        description: 'Respond to use of the keyboard when the grid is focused',
        component: KeyboardEventsGrid,
    },
    {
        pathFragment: '/edit-events',
        name: 'Edit Events',
        description: 'Respond to users changing the grid\'s data',
        component: EditEventsGrid,
    },
    {
        pathFragment: '/autofill',
        name: 'Autofill',
        description: 'Autofill',
        component: AutofillableGrid,
    },
];

export default exampleMeta;
