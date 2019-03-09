// tslint:disable-next-line:no-namespace
declare namespace Cypress {
    interface Chainable<Subject> {
        matchImageSnapshot: (name?: string) => Chainable<void>;
    }
}
