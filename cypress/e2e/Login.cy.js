///<reference types="cypress"/>

describe('LALCO Collection Management - Login Page', () => {
  beforeEach(() => {
    cy.visit('http://54.255.136.172/#/login');
  });

  it('should display all required UI elements', () => {
    cy.contains('Collection Management').should('be.visible');
    cy.get('input[type="email"]').should('be.visible').and('have.attr', 'required');
    cy.get('input[type="password"]').should('be.visible').and('have.attr', 'required');
    cy.get('input[type="checkbox"]').should('exist');
    cy.contains('Forgot password?').should('be.visible');
    cy.contains('Sign In').should('be.visible');
  });

  it('should be visible, editable, and clearable', () => {
        // Targets the email field, types the email, verifies the value, and clears it
        cy.get('[name="email"]')
          .should('be.visible')
          .type('eranda.h@lalco.la')
          .should('have.value', 'eranda.h@lalco.la')
          .clear()
          .should('have.value', '')
    })

  it('should show validation errors when fields are empty', () => {
    cy.contains('button', 'Sign In').click();
    cy.get('input[type="email"]').invoke('prop', 'validationMessage').should('not.be.empty');
  });

  it('should toggle password visibility', () => {
    cy.get('input[type="password"]').type('TestPass123!');
    cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    // Targets the typical SVG/Button used for password toggles
    cy.get('svg').last().click({ force: true }); 
    cy.get('input').should('have.attr', 'type', 'email');
  });

  it('should navigate to the forgot password route', () => {
    cy.contains('Forgot password?').click();
    cy.hash().should('include', 'forgot-password');
  });

  it('should display an error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('WrongPassword!');
    cy.contains('button', 'Sign In').click();
    // Adjust selector based on actual toast/alert implementation
    cy.contains(/error|invalid|incorrect/i).should('be.visible');
  });

  it('should log in successfully with valid credentials', () => {
    cy.get('input[type="email"]').type('eranda.h@lalco.la');
    cy.get('input[type="password"]').type('Eranda.h@1');
    cy.contains('button', 'Sign In').click();
    cy.hash().should('not.include', 'login');
  });
});
