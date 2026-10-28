Cypress.Commands.add('login', (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('http://54.255.136.172/#/login');
      cy.get('[name="email"]').clear().type(email);
      cy.get('input[type="password"]').type(password);
      cy.contains('button', /Sign In/i).click();
      cy.hash().should('not.include', 'login');
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.visit('http://54.255.136.172/#/');
        cy.hash().should('not.include', 'login');
      },
    }
  );
});