import React, { Component } from 'react';
import './App.css';
import { ReactCanvasGrid, ColumnDef, CellDef, DataRow } from 'react-canvas-grid';

const numCols = 250;
const numRows = 250;

const colDefs: ColumnDef[] = [
  {
    fieldName: 'date',
    width: 80
  }
];
for (let i = 0; i < numCols; i++) {
  colDefs.push({
    fieldName: i.toString(),
    width: 100
  });
}

const labels = [
  {text: 'Lorem', colour: 'red'},
  {text: 'Ipsum', colour: 'orange'},
  {text: 'Dolor', colour: 'lightblue'},
  {text: 'Sit', colour: 'lightgreen'},
  {text: 'Amet', colour: 'lightpink'}
];

const renderBackground = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CustomBgCellDef, column: ColumnDef) => {
  context.fillStyle = cell.data.bgColour;
  context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
};

interface CustomCellData {
  bgColour: string;
}

type CustomBgCellDef = CellDef<CustomCellData>;

type AllCellDataTypes = CustomCellData | null;

function createData() {
  const data: DataRow<AllCellDataTypes>[] = [];

  for (let i = 0; i < numRows; i++) {
    const row: DataRow<AllCellDataTypes> = {
      'date': {
        getText: () => (i + 1).toString(),
        data: null
      }
    };
    for (let j = 0; j < numCols; j++) {
      const label = labels[Math.floor(Math.random() * labels.length)];
      const cell = {
        getText: () => label.text,
        data: { bgColour: label.colour },
        renderBackground,
      };
      row[j.toString()] = cell as CellDef<AllCellDataTypes>;
    }
    data.push(row);
  }
  return data;
}

interface AppState {
  data: DataRow<AllCellDataTypes>[]
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      data: createData()
    }
  }

  render() {
    return (
      <React.Fragment>
        <div className="App">
          <header className="App-header">
            <p>
              Page header
            </p>
            <button onClick={this.replaceData}>Replace data</button>
            <button onClick={this.updateCell}>Update cell</button>
          </header>
          <div style={{height: '600px', width: '800px', overflow: 'scroll'}}>
            <div style={{height: '80px', backgroundColor: 'blue'}}>
              <span>Body header</span>
            </div>
            <div style={{paddingLeft: '100px', paddingRight: '100px', backgroundColor: 'purple'}}>
              <ReactCanvasGrid<AllCellDataTypes> columns={colDefs} data={this.state.data} rowHeight={20} />
            </div>
            <div style={{height: '80px', backgroundColor: 'red'}}>
              <span>Body footer</span>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  private replaceData = () => {
    this.setState({
      data: createData()
    })
  }

  private updateCell = () => {
    this.setState({
      data: this.state.data.map((row, i) => {
        if (i === 0) {
          const label = labels[Math.floor(Math.random() * labels.length)];
          return {
            ...row,
            0: {
              ...row[0],
              getText: () => label.text,
              data: {
                ...row[0].data,
                bgColour: label.colour
              }
            }
          };
        } else {
          return row;
        }
      })
    })
  }
}

export default App;
