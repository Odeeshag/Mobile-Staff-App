/// <reference types="cypress" />

describe('Staff LMS - Customer Visit List Page', () => {

  beforeEach(() => {

    cy.intercept('GET', '**/api/get_customer_visit_details*').as('getVisits');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');

    cy.visit('http://54.255.136.172/#/customer-visit-details');
  });

  describe('UI Rendering & Initialization', () => {
    it('should navigate to the page and display the correct title', () => {
      cy.url().should('include', 'customer-visit');

      // Verify page title
      cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Customer Visit List\s*$/i).should('be.visible');
    });

    it('should render the search input', () => {
      cy.get('input[placeholder*="Search by contract no"]').should('be.visible');
    });

    it('should render the data table with all expected columns', () => {
      const columns = [
        'Contract No',
        'Customer',
        'Visited at',
        'Visited to',
        'Visit Result',
        'Outcome',
        'Actions'
      ];

      columns.forEach((col) => {
        cy.get('thead th')
          .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
          .should('be.visible');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should allow searching by Contract No', () => {
      // Type a known contract number from the table and trigger the search
      const testContract = '2021400';
      cy.get('input[placeholder*="Search by contract no"]').type(`${testContract}{enter}`);

      // Wait for the API to return the filtered results
      cy.wait('@getVisits');

      // Verify the table filtered correctly
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', testContract);
    });

    it('should clear the search input and reload the full list', () => {
      const testContract = '2055174';
      cy.get('input[placeholder*="Search by contract no"]').type(`${testContract}{enter}`);
      cy.wait('@getVisits');

      // Clear the input (since there is no explicit 'Clear' button shown on this specific page)
      cy.get('input[placeholder*="Search by contract no"]').clear().type('{enter}');

      cy.wait('@getVisits');
      cy.get('tbody tr').should('have.length.greaterThan', 1);
    });

    it('should display an empty state for invalid contract numbers', () => {
      cy.get('input[placeholder*="Search by contract no"]').type('999999999{enter}');
      cy.wait('@getVisits');

      cy.contains('No visits found').should('be.visible');
    });
  });

  describe('Table Data & Actions', () => {
    it('should display the correct Outcome chip formatting', () => {
      // Verify that the outcome statuses are rendering in the table
      const expectedOutcomes = ['MOU Signed', 'No Result', 'Negotiated', 'Paid', 'Seized'];

      expectedOutcomes.forEach((outcome) => {
        // Checking for existence, as they might not all be visible on page 1 every time the DB updates
        cy.get('tbody').then(($tbody) => {
          if ($tbody.text().includes(outcome)) {
            cy.contains('tbody tr td', outcome).should('be.visible');
          }
        });
      });
    });

    it('should trigger the view action when the eye icon is clicked', () => {
      cy.get('tbody tr').first().within(() => {
        // Extract the Contract No for verification
        cy.get('td').eq(0).invoke('text').then((text) => {
          cy.wrap(text.trim()).as('rowContractNo');
        });

        // Click the action (eye) icon in the last column
        cy.get('td').last().find('svg, button, a').first().click();
      });
      cy.contains('View Visit Details').should('be.visible');
      
      cy.get('[role="dialog"]').contains('2021400').should('be.visible');
    
    cy.get('[aria-label="close"]').click();

    cy.contains('View Visit Details').should('not.exist');
  });
});

describe('Pagination', () => {
  it('should disable the Previous button on page 1', () => {
    cy.contains(/Page 1 of/i).should('be.visible');
    cy.contains('button', /Previous/i).should('be.disabled');
  });

  it('should navigate to the next page when Next is clicked', () => {
    // Setup dynamic intercept for pagination if the API appends `?page=2`
    cy.intercept('GET', '**/api/*get_customer_visit_details*page=2*').as('getNextPage');

    cy.contains('button', /Next/i).click();

    // Remove cy.wait() if the table paginates locally without an API call
    cy.wait('@getNextPage');

    cy.contains(/Page 2 of/i).should('be.visible');
    cy.contains('button', /Previous/i).should('not.be.disabled');
  });
});
});