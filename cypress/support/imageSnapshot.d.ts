declare namespace Cypress {
    interface Chainable<Subject> {
        matchImageSnapshot: () => Chainable<void>
    }
}