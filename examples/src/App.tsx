import React, { Component } from 'react';
import { CellDef, ColumnDef, DataRow, ReactCanvasGrid, SelectRange } from 'react-canvas-grid';
import './App.css';

const numColsLarge = 250;
const numColsSmall = 3;
const numRows = 250;

const labels = [
  {text: 'Lorem', colour: 'red'},
  {text: 'Ipsum', colour: 'orange'},
  {text: 'Dolor', colour: 'lightblue'},
  {text: 'Sit', colour: 'lightgreen'},
  {text: 'Amet', colour: 'lightpink'},
];

type HighlightPosition = 'topleft' | 'bottomright' | 'full' | 'none';
const highlights: HighlightPosition[] = [
  'topleft',
  'bottomright',
  'full',
  'none', 'none', 'none', 'none', 'none', 'none', // Hacky way to make 'none' more likely
];

const renderHeaderBackground = (context: CanvasRenderingContext2D, cellBounds: ClientRect) => {
  context.fillStyle = '#eee';
  context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
};

const renderCellBackground = (
  context: CanvasRenderingContext2D,
  cellBounds: ClientRect,
  cell: CustomBgCellDef,
) => {
  if (cell.data.highlight !== 'full') {
    context.fillStyle = cell.data.bgColour;
    context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
  }

  if (cell.data.highlight !== 'none') {
    context.fillStyle = 'yellow';
    if (cell.data.highlight === 'full') {
      context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    } else if (cell.data.highlight === 'topleft') {
      context.beginPath();
      context.moveTo(cellBounds.left, cellBounds.top);
      context.lineTo(cellBounds.left, cellBounds.bottom);
      context.lineTo(cellBounds.right, cellBounds.top);
      context.closePath();
      context.fill();
    } else if (cell.data.highlight === 'bottomright') {
      context.beginPath();
      context.moveTo(cellBounds.left, cellBounds.bottom);
      context.lineTo(cellBounds.right, cellBounds.bottom);
      context.lineTo(cellBounds.right, cellBounds.top);
      context.closePath();
      context.fill();
    }
  }
};

interface CustomCellData {
  bgColour: string;
  text: string;
  shouldReverseText: boolean;
  highlight: HighlightPosition;
}

type CustomBgCellDef = CellDef<CustomCellData>;

type AllCellDataTypes = CustomCellData | null;

function getCustomCellText(data: CustomCellData) {
  if (data.shouldReverseText) {
    return data.text.split('').reverse().join('');
  } else {
    return data.text;
  }
}

function createCols(numCols: number) {
  const colDefs: ColumnDef[] = [
    {
      fieldName: 'date',
      width: 80,
    },
  ];
  for (let i = 0; i < numCols; i++) {
    colDefs.push({
      fieldName: i.toString(),
      width: 100,
    });
  }
  return colDefs;
}

function createData(numCols: number) {
  const data: Array<DataRow<AllCellDataTypes>> = [];

  for (let i = 0; i < numRows; i++) {
    const row: DataRow<AllCellDataTypes> = {
      date: {
        text: (i + 1).toString(),
        data: null,
        renderBackground: renderHeaderBackground,
      },
    };
    for (let j = 0; j < numCols; j++) {
      const label = labels[Math.floor(Math.random() * labels.length)];
      const highlight = highlights[Math.floor(Math.random() * highlights.length)];
      const cell: CustomBgCellDef = {
        getText: getCustomCellText,
        data: { bgColour: label.colour, highlight, text: label.text, shouldReverseText: Math.random() < 0.5 },
        renderBackground: i === 0 ? renderHeaderBackground : renderCellBackground,
      };
      row[j.toString()] = cell as CellDef<AllCellDataTypes>;
    }
    data.push(row);
  }
  return data;
}

interface AppState {
  colDefs: ColumnDef[];
  data: Array<DataRow<AllCellDataTypes>>;
  selectedRange: SelectRange | null;
  isDragging: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      colDefs: createCols(numColsLarge),
      data: createData(numColsLarge),
      selectedRange: null,
      isDragging: false,
    };
  }

  public render() {
    return (
      <React.Fragment>
        <div className="App">
          <header className="App-header">
            <p>
              Page header
            </p>
            <div>
              {this.state.isDragging ? 'Dragging' : ''}
              &nbsp;
              {this.state.selectedRange ? JSON.stringify(this.state.selectedRange) : ''}
            </div>
            <button onClick={this.replaceDataLarge}>Replace data (Large)</button>
            <button onClick={this.replaceDataSmall}>Replace data (Small)</button>
            <button onClick={this.updateCell}>Update cell</button>
          </header>
          <div style={{height: '600px', width: '800px', overflow: 'scroll'}}>
            <div style={{height: '80px', backgroundColor: 'blue'}}>
              <span>Body header</span>
            </div>
            <div style={{paddingLeft: '100px', paddingRight: '100px', backgroundColor: 'purple'}}>
              <ReactCanvasGrid<AllCellDataTypes>
                cssHeight={'800px'}
                cssWidth={'800px'}
                columns={this.state.colDefs}
                data={this.state.data}
                rowHeight={20}
                frozenRows={1}
                frozenCols={1}
                onSelectionChangeStart={this.selectionChanged}
                onSelectionChangeUpdate={this.selectionChanged}
                onSelectionChangeEnd={this.selectionFinished}
                onSelectionCleared={this.selectionCleared}
              />
            </div>
            <div style={{height: '80px', backgroundColor: 'red'}}>
              <span>Body footer</span>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  private selectionChanged = (selectedRange: SelectRange) => {
    this.setState({ selectedRange, isDragging: true });
  }

  private selectionFinished = (selectedRange: SelectRange) => {
    this.setState({ selectedRange, isDragging: false });
  }

  private selectionCleared = () => {
    this.setState({ selectedRange: null, isDragging: false });
  }

  private replaceDataLarge = () => {
    this.setState({
      colDefs: createCols(numColsLarge),
      data: createData(numColsLarge),
    });
  }

  private replaceDataSmall = () => {
    this.setState({
      colDefs: createCols(numColsSmall),
      data: createData(numColsSmall),
    });
  }

  private updateCell = () => {
    this.setState({
      data: this.state.data.map((row, i) => {
        if (i === 0) {
          const label = labels[Math.floor(Math.random() * labels.length)];
          const highlight = highlights[Math.floor(Math.random() * highlights.length)];
          return {
            ...row,
            0: {
              ...row[0],
              data: {
                ...row[0].data,
                bgColour: label.colour,
                highlight,
                text: label.text,
                shouldReverseText: Math.random() < 0.5,
              },
            },
          };
        } else {
          return row;
        }
      }),
    });
  }
}

export default App;
