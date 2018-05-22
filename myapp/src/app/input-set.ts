export class InputSet {
    constructor(
        public keyword: string,
        public category: {display: string, value: string},
        public distance: string,
        public locText: string,
        // public customAddress: any
      ) {  }
}
