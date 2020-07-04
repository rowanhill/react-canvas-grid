import { GridState } from '../gridState';
import { Coord } from '../types';

export abstract class BaseSelectionState {
    public readonly isSelectionInProgress: boolean;

    public abstract getFocusGridOffset: <D>(gridState: GridState<D>) => Coord | null;

    constructor(
        isSelectionInProgress: boolean,
    ) {
        this.isSelectionInProgress = isSelectionInProgress;
    }
}
